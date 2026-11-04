import logo from '../assets/learning/logo.png'

export default function Wordmark() {
  return <span className="brand-wordmark" aria-hidden="true">
    <img className="brand-mark" src={logo} alt="" width="22" height="26" />
    <span className="brand-letters">ptiq<span className="brand-dot">.</span></span>
  </span>
}
