import React from 'react';
import './ParkingSpotCard.css';

const ParkingSpotCard = ({ image, address, lotName, price, selected, onSelect, onReserve }) => {
  return (
    <div className="parking-spot-card">
      <div className="spot-image">
        {/* Placeholder for image */}
      </div>
      <div className="spot-info">
        <div className="spot-address">{address}</div>
        <div className="spot-lot">{lotName}</div>
        <div className="spot-actions">
          <span className="spot-price">${price}</span>
          <button className={`spot-btn${selected ? ' selected' : ''}`} onClick={onSelect}>
            &#10003;
          </button>
          <button className="spot-btn" onClick={onReserve}>
            {/* Reserve icon or text */}
            <span role="img" aria-label="Reserve"></span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParkingSpotCard; 