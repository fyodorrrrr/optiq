import base64
import unittest
from unittest.mock import patch

import cv2
import numpy as np
from api_client import api_client
from services import lab7


def encoded(image):
    return cv2.imencode('.png', image)[1].tobytes()


def decoded(frame):
    return cv2.imdecode(np.frombuffer(base64.b64decode(frame.image.split(',')[1]),np.uint8), cv2.IMREAD_UNCHANGED)


class Lab7Tests(unittest.TestCase):
    def setUp(self):
        self.client = api_client()

    def test_actual_threshold_masks(self):
        image = np.zeros((50,60), np.uint8)
        image[:,30:] = 200
        result = lab7.execute(encoded(image), lab7.Settings(method='threshold'))
        np.testing.assert_array_equal(decoded(result.views[0].frame), cv2.threshold(image,0,255,cv2.THRESH_BINARY+cv2.THRESH_OTSU)[1])
        np.testing.assert_array_equal(decoded(result.views[1].frame), cv2.adaptiveThreshold(image,255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,cv2.THRESH_BINARY,31,5))

    def test_seed_fixed_range_connectivity_and_bounds(self):
        image = np.full((40,60),200,np.uint8)
        image[5:15,5:15]=30
        image[25:35,45:55]=30
        result = lab7.execute(encoded(image),lab7.Settings(method='region',seed_x=8,seed_y=8,tolerance=0))
        mask = decoded(result.views[0].frame)
        self.assertEqual(np.count_nonzero(mask),100)
        self.assertEqual(mask[30,50],0)
        with self.assertRaises(lab7.ImageError):
            lab7.execute(encoded(image),lab7.Settings(method='region',seed_x=60,seed_y=0))

    def test_watershed_separates_touching_objects_and_labels_align(self):
        image,_=lab7.generated('touching')
        result=lab7.execute(encoded(image),lab7.Settings(method='region',seed_x=170,seed_y=180))
        self.assertGreaterEqual(result.measurements['watershed_regions'],2)
        labels=cv2.imdecode(np.frombuffer(base64.b64decode(result.labels_png.split(',')[1]),np.uint8),cv2.IMREAD_UNCHANGED)
        self.assertEqual(labels.shape,image.shape[:2])
        self.assertIn(0,np.unique(labels))

    def test_watershed_overlay_omits_automatic_canvas_rim_but_keeps_internal_boundaries(self):
        image, _ = lab7.generated('touching')
        result = lab7.execute(encoded(image), lab7.Settings(method='region'))
        output = decoded(result.views[1].frame)
        source = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        np.testing.assert_array_equal(output[0], source[0])
        np.testing.assert_array_equal(output[-1], source[-1])
        np.testing.assert_array_equal(output[:, 0], source[:, 0])
        np.testing.assert_array_equal(output[:, -1], source[:, -1])
        self.assertTrue(np.any(np.all(output[1:-1, 1:-1] == (30, 30, 230), axis=2)))
        labels = cv2.imdecode(np.frombuffer(base64.b64decode(result.labels_png.split(',')[1]), np.uint8), cv2.IMREAD_UNCHANGED)
        self.assertTrue(np.all(labels[0] == 0))  # Raw watershed boundary IDs are preserved.

    def test_edges_produce_filled_regions_and_blank_inputs(self):
        image=np.zeros((100,100),np.uint8)
        cv2.rectangle(image,(20,20),(80,80),220,-1)
        result=lab7.execute(encoded(image),lab7.Settings(method='edges',min_area=20))
        self.assertEqual(decoded(result.views[1].frame)[50,50],255)
        self.assertGreater(result.measurements['enclosed_regions'],0)
        for method in ['threshold','region','edges']:
            result=lab7.execute(encoded(np.zeros((20,20),np.uint8)),lab7.Settings(method=method,seed_x=0,seed_y=0))
            self.assertTrue(result.views)

    def test_validation_missing_weights_and_invalid_images(self):
        for settings in [{'adaptive_block':4},{'canny_low':200,'canny_high':100},{'opacity':1.1},{'method':'fake'},{'tolerance':True}]:
            response=self.client.post('/api/labs/7/experiment',files={'file':('a.png',encoded(np.zeros((20,20),np.uint8)),'image/png')},data={'settings':__import__('json').dumps(settings)})
            self.assertEqual(response.status_code,422)
        with patch('services.lab7_semantic.WEIGHTS',lab7.Path('/tmp/optiq-missing-semantic.pth')):
            response=self.client.post('/api/labs/7/experiment',files={'file':('a.png',encoded(np.zeros((20,20),np.uint8)),'image/png')},data={'settings':'{"method":"semantic"}'})
            self.assertEqual(response.status_code,503)
        self.assertEqual(self.client.post('/api/labs/7/load',files={'file':('a.png',b'bad','image/png')}).status_code,422)

    def test_opacity_and_seed_bounds_api(self):
        image,_=lab7.generated('contours')
        first=lab7.execute(encoded(image),lab7.Settings(method='edges',opacity=0.0))
        np.testing.assert_array_equal(decoded(first.views[2].frame),cv2.cvtColor(image,cv2.COLOR_GRAY2BGR))
        response=self.client.post('/api/labs/7/experiment',files={'file':('a.png',encoded(image),'image/png')},data={'settings':'{"method":"region","seed_x":500,"seed_y":0}'})
        self.assertEqual(response.status_code,422)
        huge=np.zeros((1001,1000),np.uint8)
        self.assertEqual(self.client.post('/api/labs/7/load',files={'file':('a.png',encoded(huge),'image/png')}).status_code,413)

    @unittest.skipUnless(lab7.lab7_semantic.WEIGHTS.is_file(),'Prepare semantic weights for real-model checks.')
    def test_actual_semantic_ids_alignment_and_legend(self):
        image=cv2.imdecode(np.frombuffer((lab7.Path(__file__).resolve().parents[1]/'.cache/lab6/bus.jpg').read_bytes(),np.uint8),cv2.IMREAD_COLOR)
        result=lab7.execute(encoded(image),lab7.Settings(method='semantic',opacity=0.0))
        ids=cv2.imdecode(np.frombuffer(base64.b64decode(result.labels_png.split(',')[1]),np.uint8),cv2.IMREAD_UNCHANGED)
        self.assertEqual(ids.shape,image.shape[:2])
        self.assertTrue(set(np.unique(ids)).issubset(set(range(21))))
        self.assertEqual(sum(item.pixels for item in result.legend),image.shape[0]*image.shape[1])
        self.assertIn('bus',[item.name for item in result.legend])
        for item in result.legend:
            self.assertEqual(item.pixels,int(np.count_nonzero(ids==item.id)))
        np.testing.assert_array_equal(decoded(result.views[1].frame),image)
        self.assertEqual(result.provenance['working_height'],520)
        self.assertLessEqual(result.provenance['working_width'],520)
        self.assertTrue(any('IoU is not computed' in note for note in result.notes))

    def test_semantic_busy_guard(self):
        lab7.lab7_semantic.LOCK.acquire()
        try:
            with patch.object(lab7.lab7_semantic,'status',return_value={'available':True}):
                with self.assertRaises(lab7.ImageError) as caught:
                    lab7.lab7_semantic.predict(np.zeros((10,10,3),np.uint8))
                self.assertEqual(caught.exception.status,409)
        finally:
            lab7.lab7_semantic.LOCK.release()
