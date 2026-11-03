export default function SettingsHelpLink({ guideId, onOpen }: { guideId: string; onOpen: () => void }) {
  return <a className="lab-settings-help-link" href={`#${guideId}-settings`} onClick={onOpen}>Help with settings</a>
}
