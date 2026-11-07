import logo from '../assets/learning/logo-mini.svg'

export default function Wordmark() {
  return <span className="brand-wordmark" aria-hidden="true">
    <img className="brand-mark" src={logo} alt="" width="20" height="24" />
    <span className="brand-letters">ptiq<span className="brand-dot">.</span></span>
  </span>
}
