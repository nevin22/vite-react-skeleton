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
    order: number; // order in each fov
    order_adjusted: boolean;
    dwell_time?: string;
    in_time?: number;
    out_time?: number | null;
    scid: string;
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

    useEffect(() => {
        getCarsInLane(carQueue); // used to update score board counts
    }, [carQueue])

    const setCarOut = (detection: detection) => {
        setCarQueue((prevCarQueue: Car[]) => {
            let carQueueCopy = [...prevCarQueue];
            let toUpdate = carQueueCopy.findIndex(c => c.scid === detection.scid);

            carQueueCopy[toUpdate] = {
                ...carQueueCopy[toUpdate],
                status: 'out',
                out_time: detection.timestamp
            }
            return carQueueCopy
        })
    }

    const updateCarList = (detection: detection) => {
        console.log('detection', detection)
        if (detection.sf_order === 1) { // PRE ORDER
            if (detection.status.toLowerCase() === 'in') {
                const position = 'Pre-Order Point';
                setCarQueue((prevCarQueue: Car[]) => {
                    let carQueueCopy = [...prevCarQueue];
                    let fov_order = prevCarQueue.filter(c => c.position === position).length;
                    let index = prevCarQueue.length;
                    carQueueCopy.push({
                        position,
                        index: index + 1,
                        order: fov_order + 1,
                        status: 'in',
                        scid: detection.scid,
                        in_time: detection.timestamp,
                        out_time: null,
                        order_adjusted: false
                    })
                    return carQueueCopy
                })
            } else if (detection.status.toLowerCase() === 'out') {
                setCarOut(detection)
            }
        } else if (detection.sf_order === 2) { // ORDER POINT
            if (detection.status.toLowerCase() === 'in') {
                const position = 'Order Point';
                setCarQueue((prevCarQueue: Car[]) => {
                    let carQueueCopy = [...prevCarQueue];
                    let toUpdate = carQueueCopy.findIndex((car: Car) => car.position === 'Pre-Order Point' && car.status === 'out');
                    let fov_order = prevCarQueue.filter(c => c.position === position).length;
                    
                    carQueueCopy[toUpdate] = {
                        ...carQueueCopy[toUpdate],
                        status: 'in',
                        position: position,
                        in_time: detection.timestamp,
                        scid: detection.scid,
                        order: fov_order + 1
                    }

                    // adjust order so car will move to front
                    carQueueCopy.forEach((car) => {
                        if (car.position === 'Pre-Order Point')
                        car.order = car.order - 1;
                        car.order_adjusted = true;
                    })

                    return carQueueCopy
                })
            } else if (detection.status.toLowerCase() === 'out') {
                setCarOut(detection)
            }
        } else if (detection.sf_order === 3) { // SERVICE QUEUE
            if (detection.status.toLowerCase() === 'in') {
                const position = 'Service Queue Lane';
                setCarQueue((prevCarQueue: Car[]) => {
                    let fov_order = prevCarQueue.filter(c => c.position === position).length;
                    let carQueueCopy = [...prevCarQueue];
                    let toUpdate = carQueueCopy.findIndex((car: Car) => car.position === 'Order Point' && car.status === 'out');

                    carQueueCopy[toUpdate] = {
                        ...carQueueCopy[toUpdate],
                        status: 'in',
                        position: position,
                        in_time: detection.timestamp,
                        scid: detection.scid,
                        order: fov_order + 1,
                        order_adjusted: false
                    }

                    return carQueueCopy
                })
            } else if (detection.status.toLowerCase() === 'out') {
                setCarOut(detection)
            }
        } else if (detection.sf_order === 4) {
            if (detection.status.toLowerCase() === 'in') {
                const position = 'Pull Up Window';
                setCarQueue((prevCarQueue: Car[]) => {
                    let fov_order = prevCarQueue.filter(c => c.position === position).length;
                    let carQueueCopy = [...prevCarQueue];
                    let toUpdate = carQueueCopy.findIndex((car: Car) => car.position === 'Service Queue Lane' && car.status === 'out');

                    carQueueCopy[toUpdate] = {
                        ...carQueueCopy[toUpdate],
                        status: 'in',
                        position: position,
                        in_time: detection.timestamp,
                        scid: detection.scid,
                        order: fov_order + 1
                    }

                    
                    // adjust order so car will move to front
                    carQueueCopy.forEach((car) => {
                        if (car.position === 'Service Queue Lane')
                        car.order = car.order - 1;
                        car.order_adjusted = true;
                    })

                    return carQueueCopy
                })
            } else if (detection.status.toLowerCase() === 'out') {
                setCarOut(detection)
            }
        }
    }

    const remove_from_queue = (index: number) => {
        setCarQueue((prevCarQueue: Car[]) => {
            let carQueueCopy = [...prevCarQueue];
            carQueueCopy.splice(index - 1, 1)
            return carQueueCopy
        })
    }

    // MQTT SETUP
    let [client, setClient] = useState(getMqttClient());
    const topic = import.meta.env.VITE_MQTT_TOPIC;

    const cleanup = () => {
        let client = getMqttClient();
        if (client) {
            client.unsubscribe(topic, (error: any) => {
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
                updateCarList(detection)
            });
        }
    }, [client]);
    // MQTT SETUP ***

    return (
        <div className='absolute z-10 bg-transparent h-[66%] w-[85%]' style={{ right: 65, top: 0 }}>
            <img src={carPath} style={{ height: '100%', width: '100%', position: 'absolute' }} />
            { carQueue.map((c, i) => {
                return <Car
                    key={c.index}
                    windowWidth={windowWidth}
                    windowHeight={windowHeight}
                    position={c.position}
                    order={c.order}
                    order_adjusted={c.order_adjusted}
                    index={c.index}
                    status={c.status}
                    remove_from_queue={(index: number) => remove_from_queue(index)}
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