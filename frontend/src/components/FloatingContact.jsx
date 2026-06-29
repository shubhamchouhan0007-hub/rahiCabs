import { useLocation } from 'react-router-dom';
import './FloatingContact.css';

// 🔧 Business contact number — digits only, with country code, NO "+" or spaces.
//    Used for both the call (tel:) and WhatsApp (wa.me) links.
const PHONE = '919999999999';
const WHATSAPP_MESSAGE = 'Hi RahiCab, I would like to book a cab.';

// Hide on internal staff dashboards (customers never see those)
const HIDE_ON = ['/admin', '/driver', '/client', '/customer/dashboard'];

export default function FloatingContact() {
  const { pathname } = useLocation();
  if (HIDE_ON.some(p => pathname.startsWith(p))) return null;

  const waLink  = `https://wa.me/${PHONE}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  const telLink = `tel:+${PHONE}`;

  return (
    <div className="rc-float" role="complementary" aria-label="Contact RahiCab">
      <a className="rc-float-btn rc-wa" href={waLink} target="_blank" rel="noopener noreferrer"
         aria-label="Chat with us on WhatsApp">
        <i className="fab fa-whatsapp" />
        <span className="rc-float-tip">WhatsApp</span>
      </a>
      <a className="rc-float-btn rc-call" href={telLink} aria-label="Call us">
        <i className="fas fa-phone" />
        <span className="rc-float-tip">Call us</span>
      </a>
    </div>
  );
}
