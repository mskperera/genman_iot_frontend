import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { generators as dummyGenerators } from '../data'; // Import dummy data from data.js

const TableView = () => {
  const navigate = useNavigate();
  const [generators, setGenerators] = useState(dummyGenerators); // Initialize with dummy data
  const [isConnected, setIsConnected] = useState(false); // Track Socket.IO connection status
  const [showErrorModal, setShowErrorModal] = useState(false); // Control error modal visibility

  useEffect(() => {
    const socket = io(process.env.REACT_APP_SOCKET_URL, { transports: ['websocket'] });
    console.log('process.env.REACT_APP_SOCKET_URL',process.env.REACT_APP_SOCKET_URL);
    // Handle Socket.IO connection
    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
      setShowErrorModal(false); // Hide error modal on successful connection
      // Subscribe to all generator IDs from dummy data
      dummyGenerators.forEach((generator) => {
        socket.emit('subscribeToGenerator', { generatorId: generator.id });
      });
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

    // Handle real-time data
    socket.on('realtimeData', ({ generatorId, data }) => {
      console.log('Received realtimeData:', { generatorId, data });
      setGenerators((prev) =>
        prev.map((generator) =>
          generator.id === generatorId
            ? {
                ...generator, // Retain original id, name, lat, lng
                power: data.power || '-',
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

    // Handle errors from server
    socket.on('error', ({ message }) => {
      console.error('Socket.IO error:', message);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      console.log('Disconnected from Socket.IO server');
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
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        onRetry={() => {
          // Create a new Socket.IO connection for retry
          const socket = io('http://localhost:5000', { transports: ['websocket'], forceNew: true });
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

      <div style={{ height: 'calc(100vh - 20px)', overflowY: 'auto', padding: '20px' }}>
        {generators.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>No generator data available.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Name</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Geo Location</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Power</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Temperature</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Battery Level</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Coolant Level</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>AC Voltage</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Anomalies</th>
                <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {generators.map((generator) => (
                <tr key={generator.id} style={{ cursor: 'pointer' }}>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{generator.id}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{generator.name || 'N/A'}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {generator.lat || 'N/A'}, {generator.lng || 'N/A'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>{generator.power || 'N/A'}</td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <span
                      style={{
                        color: generator.status === 'online' ? 'green' : 'red',
                        fontWeight: 'bold',
                      }}
                    >
                      {generator.status || 'unknown'}
                    </span>
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {generator.temperature || 'N/A'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {generator.batteryLevel || 'N/A'}
                    {generator.batteryLevel && generator.batteryLevel !== '-' && (
                      <div
                        style={{
                          display: 'inline-block',
                          width: '50px',
                          height: '8px',
                          backgroundColor: '#e0e0e0',
                          borderRadius: '4px',
                          marginLeft: '8px',
                          verticalAlign: 'middle',
                        }}
                      >
                        <div
                          style={{
                            width: `${parseInt(generator.batteryLevel, 10)}%`,
                            height: '100%',
                            backgroundColor: '#4caf50',
                            borderRadius: '4px',
                          }}
                        ></div>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {generator.coolantLevel || 'N/A'}
                    {generator.coolantLevel && generator.coolantLevel !== '-' && (
                      <div
                        style={{
                          display: 'inline-block',
                          width: '50px',
                          height: '8px',
                          backgroundColor: '#e0e0e0',
                          borderRadius: '4px',
                          marginLeft: '8px',
                          verticalAlign: 'middle',
                        }}
                      >
                        <div
                          style={{
                            width: `${parseInt(generator.coolantLevel, 10)}%`,
                            height: '100%',
                            backgroundColor: '#2196f3',
                            borderRadius: '4px',
                          }}
                        ></div>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {generator.acVoltage || 'N/A'}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    {generator.anomalies && generator.anomalies !== '-' ? (
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
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/generator/${generator.id}`);
                      }}
                      style={{
                        padding: '5px 10px',
                        fontSize: '12px',
                        color: '#fff',
                        backgroundColor: '#3388ff',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s',
                      }}
                      onMouseOver={(e) => (e.target.style.backgroundColor = '#2566cc')}
                      onMouseOut={(e) => (e.target.style.backgroundColor = '#3388ff')}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default TableView;

// import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import io from 'socket.io-client';
// import { generators as dummyGenerators } from '../data'; // Import dummy data from data.js

// const TableView = () => {
//   const navigate = useNavigate();
//   const [generators, setGenerators] = useState(dummyGenerators); // Initialize with dummy data

//   useEffect(() => {
//     const socket = io('http://localhost:5000', { transports: ['websocket'] });

//     // Handle Socket.IO connection
//     socket.on('connect', () => {
//       console.log('Connected to Socket.IO server');
//       // Subscribe to all generator IDs from dummy data
//       dummyGenerators.forEach((generator) => {
//         socket.emit('subscribeToGenerator', { generatorId: generator.id });
//       });
//     });

    

//     // Handle real-time data
//     socket.on('realtimeData', ({ generatorId, data }) => {
//       console.log('Received realtimeData:', { generatorId, data });
//       setGenerators((prev) =>
//         prev.map((generator) =>
//           generator.id === generatorId
//             ? {
//                 ...generator, // Retain original id, name, lat, lng
//                 power: data.power || '-',
//                // status: data.status || '-',
//                 temperature: data.temperature || '-',
//                 batteryLevel: data.batteryLevel || '-',
//                 coolantLevel: data.coolantLevel || '-',
//                 acVoltage: data.acVoltage || '-',
//                 anomalies: data.anomalies || '-',
//               }: generator
         
//         )
//       );
//     });

//     // Handle status updates
//     // socket.on('generatorStatus', ({ generatorId, status }) => {
//     //   setGenerators((prev) =>
//     //     prev.map((g) =>
//     //       g.id === generatorId ? { ...g, status } : g
//     //     )
//     //   );
//     // });
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

//     // Handle errors
//     socket.on('error', ({ message }) => {
//       console.error('Socket.IO error:', message);
//     });

//     // Cleanup on unmount
//     return () => {
//       socket.disconnect();
//       console.log('Disconnected from Socket.IO server');
//     };
//   }, []);

//   return (
//     <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
//       <div style={{ height: 'calc(100vh - 20px)', overflowY: 'auto', padding: '20px' }}>
//         {generators.length === 0 ? (
//           <div style={{ textAlign: 'center', padding: '20px' }}>
//             <p>No generator data available.</p>
//           </div>
//         ) : (
//           <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
//             <thead>
//               <tr style={{ backgroundColor: '#f5f5f5' }}>
//                 <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
//                 <th style={{ padding: '10px', border: '1px solid #ddd' }}>Name</th>
//                 <th style={{ padding: '10px', border: '1px solid #ddd' }}>Geo Location</th>
//                 <th style={{ padding: '10px', border: '1px solid #ddd' }}>Power</th>
//                 <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
//                 <th style={{ padding: '10px', border: '1px solid #ddd' }}>Temperature</th>
//                 <th style={{ padding: '10px', border: '1px solid #ddd' }}>Battery Level</th>
//                 <th style={{ padding: '10px', border: '1px solid #ddd' }}>Coolant Level</th>
//                 <th style={{ padding: '10px', border: '1px solid #ddd' }}>AC Voltage</th>
//                 <th style={{ padding: '10px', border: '1px solid #ddd' }}>Anomalies</th>
//                 <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {generators.map((generator) => (
//                 <tr key={generator.id} style={{ cursor: 'pointer' }}>
//                   <td style={{ padding: '10px', border: '1px solid #ddd' }}>{generator.id}</td>
//                   <td style={{ padding: '10px', border: '1px solid #ddd' }}>{generator.name || 'N/A'}</td>
//                   <td style={{ padding: '10px', border: '1px solid #ddd' }}>{generator.lat || 'N/A'} , {generator.lng || 'N/A'}</td>
//                   <td style={{ padding: '10px', border: '1px solid #ddd' }}>{generator.power || 'N/A'}</td>
//                   <td style={{ padding: '10px', border: '1px solid #ddd' }}>
//                     <span
//                       style={{
//                         color: generator.status === 'online' ? 'green' : 'red',
//                         fontWeight: 'bold',
//                       }}
//                     >
//                       {generator.status || 'unknown'}
//                     </span>
//                   </td>
//                   <td style={{ padding: '10px', border: '1px solid #ddd' }}>
//                     {generator.temperature || 'N/A'}
//                   </td>
//                   <td style={{ padding: '10px', border: '1px solid #ddd' }}>
//                     {generator.batteryLevel || 'N/A'}
//                     {generator.batteryLevel && (
//                       <div
//                         style={{
//                           display: 'inline-block',
//                           width: '50px',
//                           height: '8px',
//                           backgroundColor: '#e0e0e0',
//                           borderRadius: '4px',
//                           marginLeft: '8px',
//                           verticalAlign: 'middle',
//                         }}
//                       >
//                         <div
//                           style={{
//                             width: `${parseInt(generator.batteryLevel, 10)}%`,
//                             height: '100%',
//                             backgroundColor: '#4caf50',
//                             borderRadius: '4px',
//                           }}
//                         ></div>
//                       </div>
//                     )}
       
//                   </td>
//                   <td style={{ padding: '10px', border: '1px solid #ddd' }}>
//                     {generator.coolantLevel || 'N/A'}
//                     {generator.coolantLevel && (
//                       <div
//                         style={{
//                           display: 'inline-block',
//                           width: '50px',
//                           height: '8px',
//                           backgroundColor: '#e0e0e0',
//                           borderRadius: '4px',
//                           marginLeft: '8px',
//                           verticalAlign: 'middle',
//                         }}
//                       >
//                         <div
//                           style={{
//                             width: `${parseInt(generator.coolantLevel, 10)}%`,
//                             height: '100%',
//                             backgroundColor: '#2196f3',
//                             borderRadius: '4px',
//                           }}
//                         ></div>
//                       </div>
//                     )}
//                   </td>
//                   <td style={{ padding: '10px', border: '1px solid #ddd' }}>
//                     {generator.acVoltage || 'N/A'}
//                   </td>
//                   <td style={{ padding: '10px', border: '1px solid #ddd' }}>
//                     {generator.anomalies ? (
//                       <span
//                         style={{
//                           color:
//                             generator.anomalies.status === 'alarm'
//                               ? 'red'
//                               : generator.anomalies.status === 'warning'
//                               ? 'orange'
//                               : 'green',
//                           fontWeight: 'bold',
//                         }}
//                       >
//                         {generator.anomalies.status} - {generator.anomalies.message}
//                       </span>
//                     ) : (
//                       'N/A'
//                     )}
//                   </td>
//                   <td style={{ padding: '10px', border: '1px solid #ddd' }}>
//                     <button
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         navigate(`/generator/${generator.id}`);
//                       }}
//                       style={{
//                         padding: '5px 10px',
//                         fontSize: '12px',
//                         color: '#fff',
//                         backgroundColor: '#3388ff',
//                         border: 'none',
//                         borderRadius: '3px',
//                         cursor: 'pointer',
//                         transition: 'background-color 0.3s',
//                       }}
//                       onMouseOver={(e) => (e.target.style.backgroundColor = '#2566cc')}
//                       onMouseOut={(e) => (e.target.style.backgroundColor = '#3388ff')}
//                     >
//                       View Details
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// };

// export default TableView;

// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { generators } from '../data';

// const TableView = () => {
//   const navigate = useNavigate();

//   return (
//     <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
//       <div style={{ height: 'calc(100vh - 20px)', overflowY: 'auto', padding: '20px' }}>
//         <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
//           <thead>
//             <tr style={{ backgroundColor: '#f5f5f5' }}>
//               <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
//               <th style={{ padding: '10px', border: '1px solid #ddd' }}>Name</th>
//               <th style={{ padding: '10px', border: '1px solid #ddd' }}>Latitude</th>
//               <th style={{ padding: '10px', border: '1px solid #ddd' }}>Longitude</th>
//               <th style={{ padding: '10px', border: '1px solid #ddd' }}>Power</th>
//               <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
//               <th style={{ padding: '10px', border: '1px solid #ddd' }}>Temperature</th>
//               <th style={{ padding: '10px', border: '1px solid #ddd' }}>Battery Level</th>
//               <th style={{ padding: '10px', border: '1px solid #ddd' }}>Coolant Level</th>
//               <th style={{ padding: '10px', border: '1px solid #ddd' }}>AC Voltage</th>
//               <th style={{ padding: '10px', border: '1px solid #ddd' }}>Anomalies</th>
//               <th style={{ padding: '10px', border: '1px solid #ddd' }}>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {generators.map((generator) => (
//               <tr key={generator.id} style={{ cursor: 'pointer' }}>
//                 <td style={{ padding: '10px', border: '1px solid #ddd' }}>{generator.id}</td>
//                 <td style={{ padding: '10px', border: '1px solid #ddd' }}>{generator.name}</td>
//                 <td style={{ padding: '10px', border: '1px solid #ddd' }}>{generator.lat}</td>
//                 <td style={{ padding: '10px', border: '1px solid #ddd' }}>{generator.lng}</td>
//                 <td style={{ padding: '10px', border: '1px solid #ddd' }}>{generator.power}</td>
//                 <td style={{ padding: '10px', border: '1px solid #ddd' }}>
//                   <span
//                     style={{
//                       color: generator.status === 'online' ? 'green' : 'red',
//                       fontWeight: 'bold',
//                     }}
//                   >
//                     {generator.status}
//                   </span>
//                 </td>
//                 <td style={{ padding: '10px', border: '1px solid #ddd' }}>{generator.temperature}</td>
//                 <td style={{ padding: '10px', border: '1px solid #ddd' }}>
//                   {generator.batteryLevel}
//                   <div
//                     style={{
//                       display: 'inline-block',
//                       width: '50px',
//                       height: '8px',
//                       backgroundColor: '#e0e0e0',
//                       borderRadius: '4px',
//                       marginLeft: '8px',
//                       verticalAlign: 'middle',
//                     }}
//                   >
//                     <div
//                       style={{
//                         width: `${parseInt(generator.batteryLevel, 10)}%`,
//                         height: '100%',
//                         backgroundColor: '#4caf50',
//                         borderRadius: '4px',
//                       }}
//                     ></div>
//                   </div>
//                 </td>
//                 <td style={{ padding: '10px', border: '1px solid #ddd' }}>
//                   {generator.coolantLevel}
//                   <div
//                     style={{
//                       display: 'inline-block',
//                       width: '50px',
//                       height: '8px',
//                       backgroundColor: '#e0e0e0',
//                       borderRadius: '4px',
//                       marginLeft: '8px',
//                       verticalAlign: 'middle',
//                     }}
//                   >
//                     <div
//                       style={{
//                         width: `${parseInt(generator.coolantLevel, 10)}%`,
//                         height: '100%',
//                         backgroundColor: '#2196f3',
//                         borderRadius: '4px',
//                       }}
//                     ></div>
//                   </div>
//                 </td>
//                 <td style={{ padding: '10px', border: '1px solid #ddd' }}>{generator.acVoltage}</td>
//                 <td style={{ padding: '10px', border: '1px solid #ddd' }}>
//                   <span
//                     style={{
//                       color:
//                         generator.anomalies.status === 'alarm'
//                           ? 'red'
//                           : generator.anomalies.status === 'warning'
//                           ? 'orange'
//                           : 'green',
//                       fontWeight: 'bold',
//                     }}
//                   >
//                     {generator.anomalies.status} - {generator.anomalies.message}
//                   </span>
//                 </td>
//                 <td style={{ padding: '10px', border: '1px solid #ddd' }}>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       navigate(`/generator/${generator.id}`);
//                     }}
//                     style={{
//                       padding: '5px 10px',
//                       fontSize: '12px',
//                       color: '#fff',
//                       backgroundColor: '#3388ff',
//                       border: 'none',
//                       borderRadius: '3px',
//                       cursor: 'pointer',
//                       transition: 'background-color 0.3s',
//                     }}
//                     onMouseOver={(e) => (e.target.style.backgroundColor = '#2566cc')}
//                     onMouseOut={(e) => (e.target.style.backgroundColor = '#3388ff')}
//                   >
//                     View Details
//                   </button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default TableView;