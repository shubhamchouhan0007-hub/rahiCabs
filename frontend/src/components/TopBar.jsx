import { useNavigate } from 'react-router-dom'
import './TopBar.css'

export default function TopBar() {
  const navigate = useNavigate()
  return (
    <header className="topbar-global">
      <div className="topbar-global-brand" onClick={() => navigate('/')}>
        <i className="fas fa-taxi" />
        <span>Rahi<b>Cab</b></span>
      </div>
    </header>
  )
}
