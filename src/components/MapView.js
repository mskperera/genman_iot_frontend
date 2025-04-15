
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import io from 'socket.io-client';
import { generators as dummyGenerators } from '../data';
import 'leaflet/dist/leaflet.css';

const createGeneratorIcon = (status, anomalyStatus) => {
  const baseIconUrl = 'https://cdn-icons-png.flaticon.com/512/3063/3063174.png';
  let color = '#3388ff'; // Default (online, normal)
  if (anomalyStatus === 'alarm') color = '#ff0000';
  else if (anomalyStatus === 'warning') color = '#ffcc00';
  else if (status === 'offline') color = '#888888';

  return new L.Icon({
    iconUrl: baseIconUrl,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    tooltipAnchor: [16, -10],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41],
  });
};

const MapView = () => {
  const navigate = useNavigate();
  const [generators, setGenerators] = useState(dummyGenerators);
  const [selectedGenerator, setSelectedGenerator] = useState(null);
  const [isConnected, setIsConnected] = useState(false); // Track Socket.IO connection status
  const [showErrorModal, setShowErrorModal] = useState(false); // Control error modal visibility

  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server (MapView)');
      setIsConnected(true);
      setShowErrorModal(false); // Hide error modal on successful connection
      dummyGenerators.forEach((generator) => {
        console.log('Emitting subscribeToGenerator:', generator.id);
        socket.emit('subscribeToGenerator', { generatorId: generator.id });
      });
    });

    socket.on('testConnection', (data) => {
      console.log('Received testConnection:', data);
    });

    socket.on('subscriptionConfirmed', ({ generatorId, status }) => {
      console.log(`Subscription confirmed for ${generatorId}: ${status}`);
    });

    // Handle real-time data
    socket.on('realtimeData', ({ generatorId, data }) => {
      console.log('Received realtimeData:', { generatorId, data });
      setGenerators((prev) =>
        prev.map((generator) =>
          generator.id === generatorId
            ? {
                ...generator,
                power: data.power || '-',
                status: data.status || 'unknown',
                temperature: data.temperature || '-',
                batteryLevel: data.batteryLevel || '-',
                coolantLevel: data.coolantLevel || '-',
                acVoltage: data.acVoltage || '-',
                anomalies: data.anomalies || '-',
              }
            : generator
        )
      );
    });

    // Handle status updates
    socket.on('generatorStatus', ({ generatorId, status }) => {
      console.log('Received generatorStatus:', { generatorId, status });
      setGenerators((prev) =>
        prev.map((generator) =>
          generator.id === generatorId
            ? status === 'offline'
              ? {
                  ...generator,
                  status,
                  power: '-',
                  temperature: '-',
                  batteryLevel: '-',
                  coolantLevel: '-',
                  acVoltage: '-',
                  anomalies: '-',
                }
              : {
                  ...generator,
                  status,
                }
            : generator
        )
      );
    });

    // Handle connection error
    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
      setIsConnected(false);
      setShowErrorModal(true);
      // Set all generators to offline
      setGenerators((prev) =>
        prev.map((generator) => ({
          ...generator,
          status: 'offline',
          power: '-',
          temperature: '-',
          batteryLevel: '-',
          coolantLevel: '-',
          acVoltage: '-',
          anomalies: '-',
        }))
      );
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from Socket.IO server:', reason);
      setIsConnected(false);
      setShowErrorModal(true);
      // Set all generators to offline
      setGenerators((prev) =>
        prev.map((generator) => ({
          ...generator,
          status: 'offline',
          power: '-',
          temperature: '-',
          batteryLevel: '-',
          coolantLevel: '-',
          acVoltage: '-',
          anomalies: '-',
        }))
      );
    });

    socket.on('error', ({ message }) => {
      console.error('Socket.IO error:', message);
    });

    return () => {
      socket.disconnect();
      console.log('Disconnected from Socket.IO server (MapView)');
    };
  }, []);

  // Modal component for error message
  const ErrorModal = ({ isOpen, onClose, onRetry, message }) => {
    if (!isOpen) return null;
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '5px',
            maxWidth: '400px',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: '#d32f2f' }}>IoT Service Unavailable</h2>
          <p>{message}</p>
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={onRetry}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4caf50',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                marginRight: '10px',
              }}
            >
              Retry Now
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#3388ff',
                color: '#fff',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ height: '100vh', width: '100vw', margin: '20px' }}>
      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onRetry={() => {
          // Create a new Socket.IO connection for retry
          const socket = io('http://localhost:5000', {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            forceNew: true,
          });
          socket.on('connect', () => {
            setIsConnected(true);
            setShowErrorModal(false);
            dummyGenerators.forEach((generator) => {
              socket.emit('subscribeToGenerator', { generatorId: generator.id });
            });
          });
          socket.on('connect_error', () => {
            setIsConnected(false);
            setShowErrorModal(true);
          });
          socket.on('disconnect', () => {
            setIsConnected(false);
            setShowErrorModal(true);
          });
        }}
        message="The IoT service is not available. Please check the server and try again."
      />

      <MapContainer
        center={[7.5, 80.5]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {generators.map((generator) => (
          <Marker
            key={generator.id}
            position={[generator.lat, generator.lng]}
            icon={createGeneratorIcon(
              generator.status,
              generator.anomalies && generator.anomalies !== '-' ? generator.anomalies.status : 'normal'
            )}
            eventHandlers={{
              click: () => setSelectedGenerator(generator),
            }}
          >
            <Tooltip direction="top" offset={[0, -15]} opacity={0.9} permanent>
              <div style={{ textAlign: 'center', fontSize: '10px' }}>
                <div>{generator.id}</div>
                {generator.anomalies && generator.anomalies !== '-' && generator.anomalies.status !== 'normal' && (
                  <div
                    style={{
                      color: generator.anomalies.status === 'warning' ? 'orange' : 'red',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      marginTop: '2px',
                    }}
                  >
                    <span>{generator.anomalies.status === 'warning' ? '⚠️' : '🔔'}</span>
                    <span>{generator.anomalies.message}</span>
                  </div>
                )}
                <span
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: generator.status === 'online' ? 'green' : 'red',
                    marginTop: '2px',
                    verticalAlign: 'middle',
                  }}
                ></span>
              </div>
            </Tooltip>
            <Popup>
              <div style={{ textAlign: 'center' }}>
                <h3>{generator.name}</h3>
                <p><strong>ID:</strong> {generator.id}</p>
                <p><strong>Status:</strong> {generator.status}</p>
                <p>
                  <strong>Anomalies:</strong>{' '}
                  {generator.anomalies && generator.anomalies !== '-' ? (
                    <span
                      style={{
                        color:
                          generator.anomalies.status === 'alarm'
                            ? 'red'
                            : generator.anomalies.status === 'warning'
                            ? 'orange'
                            : 'green',
                      }}
                    >
                      {generator.anomalies.status} - {generator.anomalies.message}
                    </span>
                  ) : (
                    'N/A'
                  )}
                </p>
                <button
                  onClick={() => navigate(`/generator/${generator.id}`)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#3388ff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;

// import React, { useEffect, useState } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
// import { useNavigate } from 'react-router-dom';
// import L from 'leaflet';
// import io from 'socket.io-client';
// import { generators as dummyGenerators } from '../data';
// import 'leaflet/dist/leaflet.css';

// const createGeneratorIcon = (status, anomalyStatus) => {
//   const baseIconUrl = 'https://cdn-icons-png.flaticon.com/512/3063/3063174.png';
//   let color = '#3388ff'; // Default (online, normal)
//   if (anomalyStatus === 'alarm') color = '#ff0000';
//   else if (anomalyStatus === 'warning') color = '#ffcc00';
//   else if (status === 'offline') color = '#888888';

//   return new L.Icon({
//     iconUrl: baseIconUrl,
//     iconSize: [32, 32],
//     iconAnchor: [16, 32],
//     popupAnchor: [0, -32],
//     tooltipAnchor: [16, -10],
//     shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
//     shadowSize: [41, 41],
//   });
// };

// const MapView = () => {
//   const navigate = useNavigate();
//   const [generators, setGenerators] = useState(dummyGenerators);
//   const [selectedGenerator, setSelectedGenerator] = useState(null);

//   useEffect(() => {
//     const socket = io('http://localhost:5000', {
//       transports: ['websocket', 'polling'],
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000,
//     });

//     socket.on('connect', () => {
//       console.log('Connected to Socket.IO server (MapView)');
//       dummyGenerators.forEach((generator) => {
//         console.log('Emitting subscribeToGenerator:', generator.id);
//         socket.emit('subscribeToGenerator', { generatorId: generator.id });
//       });
//     });

//     socket.on('testConnection', (data) => {
//       console.log('Received testConnection:', data);
//     });

//     socket.on('subscriptionConfirmed', ({ generatorId, status }) => {
//       console.log(`Subscription confirmed for ${generatorId}: ${status}`);
//     });

//     // Handle real-time data
//     socket.on('realtimeData', ({ generatorId, data }) => {
//       console.log('Received realtimeData:', { generatorId, data });
//       setGenerators((prev) =>
//         prev.map((generator) =>
//           generator.id === generatorId
//             ? {
//                 ...generator,
//                 power: data.status === 'online' ? data.power || '-' : '-',
//                 status: data.status || 'unknown',
//                 temperature: data.status === 'online' ? data.temperature || '-' : '-',
//                 batteryLevel: data.status === 'online' ? data.batteryLevel || '-' : '-',
//                 coolantLevel: data.status === 'online' ? data.coolantLevel || '-' : '-',
//                 acVoltage: data.status === 'online' ? data.acVoltage || '-' : '-',
//                 anomalies: data.status === 'online' ? data.anomalies || '-' : '-',
//               }
//             : generator
//         )
//       );
//     });

//     // Handle status updates
//     socket.on('generatorStatus', ({ generatorId, status }) => {
//       console.log('Received generatorStatus:', { generatorId, status });
//       setGenerators((prev) =>
//         prev.map((generator) =>
//           generator.id === generatorId
//             ? status === 'offline'
//               ? {
//                   ...generator,
//                   status,
//                   power: '-',
//                   temperature: '-',
//                   batteryLevel: '-',
//                   coolantLevel: '-',
//                   acVoltage: '-',
//                   anomalies: '-',
//                 }
//               : {
//                   ...generator,
//                   status,
//                 }
//             : generator
//         )
//       );
//     });

//     socket.on('connect_error', (err) => {
//       console.error('Socket.IO connection error:', err.message);
//     });

//     socket.on('error', ({ message }) => {
//       console.error('Socket.IO error:', message);
//     });

//     return () => {
//       socket.disconnect();
//       console.log('Disconnected from Socket.IO server (MapView)');
//     };
//   }, []);

//   return (
//     <div style={{ height: '100vh', width: '100vw', margin: '20px' }}>
//       <MapContainer
//         center={[7.5, 80.5]}
//         zoom={7}
//         style={{ height: '100%', width: '100%' }}
//       >
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         />
//         {generators.map((generator) => (
//           <Marker
//             key={generator.id}
//             position={[generator.lat, generator.lng]}
//             icon={createGeneratorIcon(
//               generator.status,
//               generator.anomalies && generator.anomalies !== '-' ? generator.anomalies.status : 'normal'
//             )}
//             eventHandlers={{
//               click: () => setSelectedGenerator(generator),
//             }}
//           >
//             <Tooltip direction="top" offset={[0, -15]} opacity={0.9} permanent>
//               <div style={{ textAlign: 'center', fontSize: '10px' }}>
//                 <div>{generator.id}</div>
//                 {generator.anomalies && generator.anomalies !== '-' && generator.anomalies.status !== 'normal' && (
//                   <div
//                     style={{
//                       color: generator.anomalies.status === 'warning' ? 'orange' : 'red',
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       gap: '4px',
//                       marginTop: '2px',
//                     }}
//                   >
//                     <span>{generator.anomalies.status === 'warning' ? '⚠️' : '🔔'}</span>
//                     <span>{generator.anomalies.message}</span>
//                   </div>
//                 )}
//                 <span
//                   style={{
//                     display: 'inline-block',
//                     width: '10px',
//                     height: '10px',
//                     borderRadius: '50%',
//                     backgroundColor: generator.status === 'online' ? 'green' : 'red',
//                     marginTop: '2px',
//                     verticalAlign: 'middle',
//                   }}
//                 ></span>
//               </div>
//             </Tooltip>
//             <Popup>
//               <div style={{ textAlign: 'center' }}>
//                 <h3>{generator.name}</h3>
//                 <p><strong>ID:</strong> {generator.id}</p>
//                 <p><strong>Status:</strong> {generator.status}</p>
//                 <p>
//                   <strong>Anomalies:</strong>{' '}
//                   {generator.anomalies && generator.anomalies !== '-' ? (
//                     <span
//                       style={{
//                         color:
//                           generator.anomalies.status === 'alarm'
//                             ? 'red'
//                             : generator.anomalies.status === 'warning'
//                             ? 'orange'
//                             : 'green',
//                       }}
//                     >
//                       {generator.anomalies.status} - {generator.anomalies.message}
//                     </span>
//                   ) : (
//                     'N/A'
//                   )}
//                 </p>
//                 <button
//                   onClick={() => navigate(`/generator/${generator.id}`)}
//                   style={{
//                     padding: '5px 10px',
//                     backgroundColor: '#3388ff',
//                     color: 'white',
//                     border: 'none',
//                     borderRadius: '3px',
//                     cursor: 'pointer',
//                   }}
//                 >
//                   View Details
//                 </button>
//               </div>
//             </Popup>
//           </Marker>
//         ))}
//       </MapContainer>
//     </div>
//   );
// };

// export default MapView;

// import React, { useState } from 'react';
// import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
// import { useNavigate } from 'react-router-dom';
// import L from 'leaflet';
// import { generators } from '../data';
// import 'leaflet/dist/leaflet.css';

// const createGeneratorIcon = (status, anomalyStatus) => {
//   const baseIconUrl = 'https://cdn-icons-png.flaticon.com/512/3063/3063174.png';
//   let color = '#3388ff';
//   if (status === 'offline') color = '#888888';
//   if (anomalyStatus === 'warning') color = '#ffcc00';
//   if (anomalyStatus === 'alarm') color = '#ff0000';

//   return new L.Icon({
//     iconUrl: baseIconUrl,
//     iconSize: [32, 32],
//     iconAnchor: [16, 32],
//     popupAnchor: [0, -32],
//     tooltipAnchor: [16, -10],
//     shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
//     shadowSize: [41, 41],
//   });
// };

// const MapView = () => {
//   const navigate = useNavigate();
//   const [selectedGenerator, setSelectedGenerator] = useState(null);

//   return (
//     <div style={{ height: '100vh', width: '100vw', margin: '20px' }}>
//       <MapContainer
//         center={[7.5, 80.5]}
//         zoom={7}
//         style={{ height: '100%', width: '100%' }}
//       >
//         <TileLayer
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//           attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//         />
//         {generators.map((generator) => (
//           <Marker
//             key={generator.id}
//             position={[generator.lat, generator.lng]}
//             icon={createGeneratorIcon(generator.status, generator.anomalies.status)}
//             eventHandlers={{
//               click: () => setSelectedGenerator(generator),
//             }}
//           >
//             <Tooltip direction="top" offset={[0, -15]} opacity={0.9} permanent>
//               <div style={{ textAlign: 'center', fontSize: '10px' }}>
//                 <div>{generator.id}</div>
//                 {generator.anomalies.status !== 'normal' && (
//                   <div
//                     style={{
//                       color: generator.anomalies.status === 'warning' ? 'orange' : 'red',
//                       display: 'flex',
//                       alignItems: 'center',
//                       justifyContent: 'center',
//                       gap: '4px',
//                       marginTop: '2px',
//                     }}
//                   >
//                     <span>{generator.anomalies.status === 'warning' ? '⚠️' : '🔔'}</span>
//                     <span>{generator.anomalies.message}</span>
//                   </div>
//                 )}
//                 <span
//                   style={{
//                     display: 'inline-block',
//                     width: '10px',
//                     height: '10px',
//                     borderRadius: '50%',
//                     backgroundColor: generator.status === 'online' ? 'green' : 'red',
//                     marginTop: '2px',
//                     verticalAlign: 'middle',
//                   }}
//                 ></span>
//               </div>
//             </Tooltip>
//             <Popup>
//               <div style={{ textAlign: 'center' }}>
//                 <h3>{generator.name}</h3>
//                 <p><strong>ID:</strong> {generator.id}</p>
//                 <p><strong>Status:</strong> {generator.status}</p>
//                 <p>
//                   <strong>Anomalies:</strong>{' '}
//                   <span
//                     style={{
//                       color:
//                         generator.anomalies.status === 'alarm'
//                           ? 'red'
//                           : generator.anomalies.status === 'warning'
//                           ? 'orange'
//                           : 'green',
//                     }}
//                   >
//                     {generator.anomalies.status} - {generator.anomalies.message}
//                   </span>
//                 </p>
//                 <button
//                   onClick={() => navigate(`/generator/${generator.id}`)}
//                   style={{
//                     padding: '5px 10px',
//                     backgroundColor: '#3388ff',
//                     color: 'white',
//                     border: 'none',
//                     borderRadius: '3px',
//                     cursor: 'pointer',
//                   }}
//                 >
//                   View Details
//                 </button>
//               </div>
//             </Popup>
//           </Marker>
//         ))}
//       </MapContainer>
//     </div>
//   );
// };

// export default MapView;