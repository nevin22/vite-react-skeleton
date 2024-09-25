import { useState, useEffect } from 'react';
// import { useSpring, animated, useSpringRef, useChain } from '@react-spring/web';
import { initializeMqttClient, getMqttClient } from '../utils/mqttHelper';
import '../css/root.css';

import Car from './car';
import carPath from '../assets/car_path_5.svg';

interface CarPathProps {
    getCarsInLane: (Cars: Car[]) => Car[]
}

interface Car {
    position: string;
    index: number;
    dwell_time?: string;
    in_time?: number;
    out_time?: number;
    status: string;
}

interface detection {
    scid: string;
    serial_id: string;
    sf_flow: string;
    sf_order: number;
    site_id: string;
    status: string;
    timestamp: number;
}

function CarPath({ getCarsInLane }: CarPathProps) {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth * 0.845);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight * 0.655);
    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth * 0.845);
            setWindowHeight(window.innerHeight * 0.660);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const [carQueue, setCarQueue] = useState<Car[]>([]);

    const updateCar = (detection: detection) => {}

    const addCar = (detection: detection) => {
        const position = 'Pre-Order Point';
        const index = carQueue.filter(c => c.position === position).length;
        setCarQueue([...carQueue, {
            position,
            index: index + 1,
            in_time: detection.timestamp,
            status: 'in'
        }])

        getCarsInLane([...carQueue, { // for main board updates
            position,
            index: index + 1,
            in_time: detection.timestamp,
            status: 'in'
        }]);
    }

    const addOrderPoint = () => {
        const position = 'Order Point';
        const carQeueueCopy = [...carQueue];
        const carIndex = carQeueueCopy.findIndex(car => car.position === 'Pre-Order Point');
        if (carIndex !== -1) {
            carQeueueCopy[carIndex].position = position;
            setCarQueue(carQeueueCopy)
            getCarsInLane(carQeueueCopy);
        }
    }

    const addServiceQueueLane = () => {
        const position = 'Service Queue Lane';
        const index = carQueue.filter(c => c.position === position).length;
        const carQeueueCopy = [...carQueue];
        const carIndex = carQeueueCopy.findIndex(car => car.position === 'Order Point');
        if (carIndex !== -1) {
            carQeueueCopy[carIndex].position = position;
            carQeueueCopy[carIndex].index = index + 1;
            setCarQueue(carQeueueCopy)
            getCarsInLane(carQeueueCopy);
        }
    }

    const addPullUpWindow = () => {
        const position = 'Pull Up Window';
        const carQeueueCopy = [...carQueue];
        const carIndex = carQeueueCopy.findIndex(car => car.position === 'Service Queue Lane');
        if (carIndex !== -1) {
            carQeueueCopy[carIndex].position = position;
            setCarQueue(carQeueueCopy)
            getCarsInLane(carQeueueCopy);
        }
    }

    // MQTT SETUP
    let [client, setClient] = useState(getMqttClient());
    const topic = import.meta.env.VITE_MQTT_TOPIC;

    const cleanup = () => {
        let client = getMqttClient();
        if (client) {
            client.unsubscribe(topic, error => {
                if (error) {
                    console.log('Unsubscribe error', error)
                    return
                }
                console.log('unsubscribed from ', topic)
            });
        }
    }

    useEffect(() => {
        if (getMqttClient() === null) {
            initializeMqttClient(() => {
                setClient(getMqttClient())
            })
        }
        return () => cleanup()
    }, [])

    useEffect(() => {
        if (client) {
            client.on('connect', () => {
                console.log('connected')
            });
            client.on('error', (err) => {
                console.error('Connection error: ', err);
                client.end();
            });
            client.on('reconnect', () => {
                console.log('reconnecting')
            });
            client.subscribe(topic, { qos: 0 }, (error) => {
                if (error) {
                    console.log('Subscribe to topics error', error)
                    return
                } else {
                    console.log('subsribed to ', topic)
                }
            });

            client.on('message', (topic, message) => {
                const detection = JSON.parse(message.toString())
                console.log('detection - ', detection)
                if (detection.sf_order === 1) {
                    addCar(detection)
                }
            });
        }
    }, [client]);
    // MQTT SETUP ***

    return (
        <div className='absolute z-10 bg-transparent h-[66%] w-[85%]' style={{ right: 65, top: 0 }}>
            <img src={carPath} style={{ height: '100%', width: '100%', position: 'absolute' }} />
            { carQueue.map((c, i) => {
                return <Car
                    key={i}
                    windowWidth={windowWidth}
                    windowHeight={windowHeight}
                    position={c.position}
                    index={c.index}
                />
            })
            }
            
            {/* <button className='absolute' style={{ left: -200, top: 550}} onClick={() => addCar()}>Add Car Pre Order</button>
            <button className='absolute' style={{ left: -200, top: 600}} onClick={() => addOrderPoint()}>Move To Order Point</button>
            <button className='absolute' style={{ left: -200, top: 650}} onClick={() => addServiceQueueLane()}>Move To Service queue lane</button>
            <button className='absolute' style={{ left: -200, top: 700}} onClick={() => addPullUpWindow()}> Add PUW</button>  */}
        </div>
    );
}

export default CarPath;