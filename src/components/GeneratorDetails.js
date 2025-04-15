import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generators } from '../data';

const GeneratorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const generator = generators.find((g) => g.id === id);

  if (!generator) {
    return <h2>Generator not found</h2>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>{generator.name}</h1>
      <p><strong>ID:</strong> {generator.id}</p>
      <p><strong>Power:</strong> {generator.power}</p>
      <p><strong>Status:</strong> {generator.status}</p>
      <p><strong>Location:</strong> Lat: {generator.lat}, Lng: {generator.lng}</p>
      <p><strong>Temperature:</strong> {generator.temperature}</p>
      <p><strong>Battery Level:</strong> {generator.batteryLevel}</p>
      <p><strong>Coolant Level:</strong> {generator.coolantLevel}</p>
      <p><strong>AC Voltage:</strong> {generator.acVoltage}</p>
      <p>
        <strong>Anomalies:</strong>{' '}
        <span
          style={{
            color:
              generator.anomalies.status === 'alarm'
                ? 'red'
                : generator.anomalies.status === 'warning'
                ? 'orange'
                : 'green',
            fontWeight: 'bold',
          }}
        >
          {generator.anomalies.status} - {generator.anomalies.message}
        </span>
      </p>
      <button
        onClick={() => navigate('/')} // Back to map as default
        style={{
          padding: '10px 20px',
          backgroundColor: '#3388ff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#2566cc')}
        onMouseOut={(e) => (e.target.style.backgroundColor = '#3388ff')}
      >
        Back to Map
      </button>
    </div>
  );
};

export default GeneratorDetails;