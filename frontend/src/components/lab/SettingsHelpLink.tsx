export default function SettingsHelpLink({ guideId }: { guideId: string }) {
  return <a className="lab-settings-help-link" href={`#${guideId}`} onClick={() => {
    document.getElementById(guideId)?.focus({ preventScroll: true })
  }}>Help with settings</a>
}
