import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './FloatingContact.css';

// Same base the rest of the app uses: api.rahicab.in in prod, proxied /api in dev
const API_BASE = import.meta.env.VITE_API_URL || '/api';
const WHATSAPP_MESSAGE = 'Hi RahiCab, I would like to book a cab.';

// Hide on internal staff dashboards (customers never see those)
const HIDE_ON = ['/admin', '/driver', '/client', '/customer/dashboard'];

// Normalize any admin-entered format to E.164 digits with India country code.
// "+91 99999 99999" → "919999999999", "9876543210" → "919876543210"
function normalize(raw) {
  if (!raw) return '';
  let d = String(raw).replace(/\D/g, '');
  if (d.length === 10) d = '91' + d;
  return d;
}

export default function FloatingContact() {
  const { pathname } = useLocation();
  const [phone, setPhone]       = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Pull the admin-managed numbers from public settings
  useEffect(() => {
    axios.get(`${API_BASE}/public/settings`)
      .then(r => {
        const call = normalize(r.data['contact.phone']);
        setPhone(call);
        setWhatsapp(normalize(r.data['contact.whatsapp']) || call); // fall back to call number
      })
      .catch(() => {});
  }, []);

  if (HIDE_ON.some(p => pathname.startsWith(p))) return null;
  if (!phone && !whatsapp) return null; // nothing configured / not loaded yet

  const waLink  = whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}` : null;
  const telLink = phone    ? `tel:+${phone}` : null;

  return (
    <div className="rc-float" role="complementary" aria-label="Contact RahiCab">
      {waLink && (
        <a className="rc-float-btn rc-wa" href={waLink} target="_blank" rel="noopener noreferrer"
           aria-label="Chat with us on WhatsApp">
          <i className="fab fa-whatsapp" />
          <span className="rc-float-tip">WhatsApp</span>
        </a>
      )}
      {telLink && (
        <a className="rc-float-btn rc-call" href={telLink} aria-label="Call us">
          <i className="fas fa-phone" />
          <span className="rc-float-tip">Call us</span>
        </a>
      )}
    </div>
  );
}
