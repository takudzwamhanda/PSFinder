import React from 'react';
import './WhyChoose.css';
import realTimeSearchImg from '../imgs/real time search.jpg';
import securePaymentsImg from '../imgs/secure payments.jpg';
import easyManagementImg from '../imgs/easy management.jpg';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    img: realTimeSearchImg,
    title: 'Real-Time Search',
    desc: 'Find available parking spots near you with live GPS and Google Maps integration.'
  },
  {
    img: securePaymentsImg,
    title: 'Secure Payments',
    desc: 'Reserve and pay for parking with Stripe or PayPal. PCI-compliant and safe.'
  },
  {
    img: easyManagementImg,
    title: 'Easy Management',
    desc: 'Parking lot owners can list, update, and manage spots and pricing in real time.'
  }
];

const WhyChoose = () => {
  const navigate = useNavigate();
  return (
    <section className="whychoose-root">
      <div className="whychoose-header">
        <h2>Why Choose Parking Space Finder?</h2>
        <button className="whychoose-learn-btn" onClick={() => navigate('/about')}>Learn More</button>
      </div>
      <div className="whychoose-features">
        {features.map((f, i) => (
          <div className="feature-card" key={i}>
            <img src={f.img} alt={f.title} className="feature-img" />
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default WhyChoose; 