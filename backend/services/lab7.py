from pathlib import Path
from time import perf_counter
import cv2
import numpy as np
from schemas.lab7 import LegendItem, Result, Settings, View
from services.images import ImageError, decode_image, encode_png, frame
from services import lab7_semantic


def load(content):
    image,notes=decode_image(content)
    if image.shape[0]*image.shape[1]>1_000_000:
        raise ImageError('Segmentation supports at most one million pixels. Resize the image in Lab 1 first.',413)
    return image,notes


def load_image(content):
    image,notes=load(content)
    return frame(image,notes)


def generated(kind):
    image=np.full((360,480),25,np.uint8)
    cv2.circle(image,(170,180),80,210,-1)
    cv2.circle(image,(290,180),80,210,-1)
    if kind=='uneven':
        image=np.clip(image.astype(float)*np.linspace(.35,1.0,480)[None,:]+np.linspace(0,45,480)[None,:],0,255).astype(np.uint8)
    if kind=='contours':
        image[:]=25
        cv2.rectangle(image,(60,70),(200,290),210,-1)
        cv2.circle(image,(340,180),75,190,-1)
    return image,[f'Optiq-generated {kind} segmentation sample; deterministic geometry.']


def sample(kind):
    if kind=='scene':
        path=Path(__file__).resolve().parents[1]/'.cache/lab6/bus.jpg'
        if not path.is_file():
            raise ImageError('Natural scene sample is missing. Run the Lab 7 setup or upload an image.',503)
        image,notes=load(path.read_bytes())
        return frame(image,[*notes,'Ultralytics bus demonstration image; reused from explicit sample setup.'])
    image,notes=generated(kind)
    return frame(image,notes)


def palette(ids):
    colors=np.zeros((max(256,int(ids.max())+1),3),np.uint8)
    for index in range(1,len(colors)):
        value=index
        for bit in range(8):
            for channel in range(3):
                colors[index,channel] |= ((value >> channel)&1) << (7-bit)
            value >>= 3
    return colors


def colored(labels):
    return palette(labels)[labels][:,:,::-1].copy()


def overlay(image,labels,opacity):
    output=image.copy()
    mask=labels>0
    tint=colored(labels)
    output[mask]=np.rint(image[mask]*(1-opacity)+tint[mask]*opacity).clip(0,255).astype(np.uint8)
    return output


def watershed(image,binary,fraction):
    opened=cv2.morphologyEx(binary,cv2.MORPH_OPEN,np.ones((3,3),np.uint8),iterations=2)
    distance=cv2.distanceTransform(opened,cv2.DIST_L2,5)
    seeds=(distance>fraction*distance.max()).astype(np.uint8) if distance.max()>0 else np.zeros_like(binary)
    count,markers=cv2.connectedComponents(seeds)
    if count>1000:
        raise ImageError('Too many watershed markers. Use a cleaner image or adjust foreground settings.')
    markers+=1
    background=cv2.dilate(opened,np.ones((3,3),np.uint8),iterations=3)
    markers[(background>0)&(seeds==0)]=0
    markers=cv2.watershed(image.copy(),markers.astype(np.int32))
    return markers,seeds*255


def execute(content,settings):
    image,notes=load(content)
    gray=image if image.ndim==2 else cv2.cvtColor(image,cv2.COLOR_BGR2GRAY)
    bgr=cv2.cvtColor(image,cv2.COLOR_GRAY2BGR) if image.ndim==2 else image
    started=perf_counter()
    views=[]
    measurements={}
    legend=[]
    labels_png=None
    provenance={'engine':f'OpenCV {cv2.__version__}'}
    def view(title,array,description):
        views.append(View(title=title,frame=frame(array),description=description))
    threshold_type=cv2.THRESH_BINARY_INV if settings.invert else cv2.THRESH_BINARY
    if settings.method=='threshold':
        threshold,otsu=cv2.threshold(gray,0,255,threshold_type+cv2.THRESH_OTSU)
        adaptive=cv2.adaptiveThreshold(gray,255,cv2.ADAPTIVE_THRESH_GAUSSIAN_C,threshold_type,settings.adaptive_block,settings.adaptive_c)
        view('Otsu mask',otsu,'White is foreground; one automatically selected global threshold.')
        view('Adaptive mask',adaptive,'Gaussian-weighted local threshold minus C; white is foreground.')
        measurements={'otsu_threshold':threshold,'otsu_foreground_pixels':int(np.count_nonzero(otsu)),'adaptive_foreground_pixels':int(np.count_nonzero(adaptive))}
    elif settings.method=='region':
        if settings.seed_x>=gray.shape[1] or settings.seed_y>=gray.shape[0]:
            raise ImageError('The seed must be inside the input image.')
        mask=np.zeros((gray.shape[0]+2,gray.shape[1]+2),np.uint8)
        cv2.floodFill(gray.copy(),mask,(settings.seed_x,settings.seed_y),0,settings.tolerance,settings.tolerance,
                      cv2.FLOODFILL_FIXED_RANGE|cv2.FLOODFILL_MASK_ONLY|(255<<8)|4)
        grown=mask[1:-1,1:-1]
        _,binary=cv2.threshold(gray,0,255,threshold_type+cv2.THRESH_OTSU)
        markers,seeds=watershed(bgr,binary,settings.watershed_fraction)
        display=np.where(markers>1,markers-1,0).astype(np.uint16)
        marked=overlay(bgr,display,settings.opacity)
        marked[markers==-1]=(30,30,230)
        view('Seed-grown mask',grown,'4-connected pixels within tolerance of the original seed intensity.')
        view('Watershed regions',marked,'Colors identify separate regions, not object classes. Red marks watershed boundaries.')
        view('Watershed markers',seeds,'Distance-transform peaks used as foreground markers.')
        raw=np.where(markers==-1,0,markers).astype(np.uint16)
        labels_png=encode_png(raw)
        notes.append('Watershed raw labels:0 boundary/unassigned,1 background,2+ object-region IDs; uint16 PNG.')
        measurements={'grown_pixels':int(np.count_nonzero(grown)),'watershed_regions':int(len(np.unique(markers[markers>1])))}
    elif settings.method=='edges':
        blurred=cv2.GaussianBlur(gray,(3,3),0)
        edges=cv2.Canny(blurred,settings.canny_low,settings.canny_high)
        closed=cv2.morphologyEx(edges,cv2.MORPH_CLOSE,np.ones((settings.closing_size,settings.closing_size),np.uint8))
        # Exterior flood fill identifies enclosed areas; open edge chains do not become filled objects.
        padded=cv2.copyMakeBorder(closed,1,1,1,1,cv2.BORDER_CONSTANT,value=0)
        exterior=padded.copy()
        cv2.floodFill(exterior,None,(0,0),255)
        enclosed=cv2.bitwise_not(exterior)[1:-1,1:-1]
        count,labels,stats,_=cv2.connectedComponentsWithStats(enclosed)
        retained=stats[:,cv2.CC_STAT_AREA]>=settings.min_area
        retained[0]=False
        mask=(retained[labels]*255).astype(np.uint8)
        regions=int(np.count_nonzero(retained))
        view('Canny boundaries',closed,'Gaussian3×3 → Canny → morphological closing. This is the intermediate edge map.')
        view('Enclosed-region mask',mask,'Filled areas enclosed by edges, filtered by minimum area. Open boundaries may produce no region.')
        view('Region overlay',overlay(bgr,(mask>0).astype(np.uint8),settings.opacity),'Only the filled region mask is overlaid.')
        measurements={'enclosed_regions':regions,'region_pixels':int(np.count_nonzero(mask))}
    else:
        labels,names,provenance=lab7_semantic.predict(bgr)
        view('Semantic class map',colored(labels),'Each color denotes a predicted pixel class; background is black.')
        view('Semantic overlay',overlay(bgr,labels,settings.opacity),'Predicted classes restored to original dimensions; background leaves the source visible.')
        colors=palette(labels)
        for value,pixels in zip(*np.unique(labels,return_counts=True)):
            legend.append(LegendItem(id=int(value),name=names[value],color='#'+''.join(f'{channel:02x}' for channel in colors[value]),pixels=int(pixels)))
        labels_png=encode_png(labels)
        measurements={'predicted_classes':len(legend),'foreground_pixels':int(np.count_nonzero(labels))}
        notes.append('Raw semantic PNG stores VOC class IDs0–20, not display brightness. Background ID0 is a model prediction, not an unknown or ignored label.')
    measurements['elapsed_ms']=(perf_counter()-started)*1000
    notes.append('No compatible ground truth was provided; IoU is not computed. Pixel/region counts are not accuracy.')
    return Result(parameters=settings,views=views,measurements=measurements,legend=legend,labels_png=labels_png,notes=notes,provenance=provenance)
