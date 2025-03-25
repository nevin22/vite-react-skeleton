import { useState, useEffect } from 'react';
// import { useSpring, animated, useSpringRef, useChain } from '@react-spring/web';
import { initializeMqttClient, getMqttClient } from '../utils/mqttHelper';
import '../css/root.css';

import Car from './car';
import carPath from '../assets/car_path_5.svg';

interface CarPathProps {
    getCarsInLane: (Cars: Car[]) => Car[],
    getMetrics: (metrics: metrics) => void;
}

interface Car {
    position: string;
    index: number;
    order: number; // order in each fov
    order_adjusted: boolean;
    dwell_time?: string;
    in_time?: string | number;
    out_time?: number | null;
    scid: string;
    status: string;
    initialSetup?: boolean;
    sf_order: number;
}

interface metrics {
    average_dwell_ent: number;
    average_dwell_op: number;
    average_dwell_queue: number;
    average_dwell_puw: number;
}

interface detection {
    scid: string;
    sf_flow: string;
    sf_order: number;
    status: string;
    timestamp: number;
}

function CarPath({ getCarsInLane, getMetrics }: CarPathProps) {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth * 0.845);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight * 0.655);

    const [isInitialSetup, setIsInitialSetup] = useState(true);

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

    // MQTT SETUP
    let [client, setClient] = useState(getMqttClient());
    const metrics_topic = `/viana/${import.meta.env.VITE_MQTT_SITE_ID}/scoreboard/metrics`;
    const get_metrics_topic = `/viana/${import.meta.env.VITE_MQTT_SITE_ID}/scoreboard/get_metrics`;
    const events_topic = `/viana/${import.meta.env.VITE_MQTT_SITE_ID}/scoreboard/events`;

    const cleanup = () => {
        let client = getMqttClient();
        if (client) {
            client.unsubscribe([metrics_topic, events_topic], (error: any) => {
                if (error) {
                    console.log('Unsubscribe error', error)
                    return
                }
                console.log('unsubscribed from ', metrics_topic, 'and', events_topic)
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
                console.log('connected');
                client.publish(get_metrics_topic, '{"trigger": "any" }', { qos: 1 }, (error: any) => {
                    if (error) {
                        console.log('Publish error', error);
                        return;
                    }
                    setTimeout(() => {
                        client.subscribe([metrics_topic, events_topic], { qos: 0 }, (error) => {
                            if (error) {
                                console.log('Subscribe to topics error', error)
                                return
                            } else {
                                console.log('subsribed to ', metrics_topic, 'and', events_topic)
                            }
                        });
                    }, 1000)
                });
            });

            client.on('error', (err) => {
                console.error('Connection error: ', err);
                client.end();
            });

            client.on('reconnect', () => {
                console.log('reconnecting')
            });

            client.on('message', (topic, message) => {
                const detection = JSON.parse(message.toString())
                if (topic === metrics_topic) {
                    console.log('metrics', detection)
                    const metrics = detection?.metrics;
                    getMetrics(metrics);
                    if (isInitialSetup) {
                        setInitialCarPlacement(detection.dt_array)
                        setIsInitialSetup(false);
                    }
                } else if (topic === events_topic) {
                    console.log('new_event', detection)
                    updateCarList({
                        status: detection.event === 'zone_in' ? 'in' : 'out',
                        scid: detection.scid,
                        sf_flow: detection.flow,
                        sf_order: detection.order,
                        timestamp: detection.timestamp
                    })
                }
            });
        }
    }, [client]);
    // MQTT SETUP ***

    const setInitialCarPlacement = (car_queue: any) => {
        let cars: Car[] = [];
        let index = 1;

        Object.keys(car_queue).sort((a, b) => Number(a) - Number(b)).forEach((key) => {
            const { sf_flow, queue } = car_queue[key];

            queue.forEach((car: any, order: number) => {
                let position = '';
                switch (key) {
                    case '1':
                        position = 'Pre-Order Point'
                        break;
                    case '2':
                        position = 'Order Point'
                        break;
                    case '3':
                        position = 'Service Queue Lane'
                        break;
                    case '4':
                        position = 'Pull Up Window'
                        break;
                    default:
                }
                cars.push({
                    position,
                    index: index,
                    order: order + 1,
                    order_adjusted: false,
                    dwell_time: '',
                    in_time: `${car.ts}`,
                    out_time: null,
                    scid: car.scid,
                    status: 'in',
                    sf_order: parseInt(key),
                    initialSetup: true
                });
                index += 1;
            });
        });
        setCarQueue(cars)
    }

    const setCarOut = (detection: detection) => {
        setCarQueue((prevCarQueue: Car[]) => {
            let carQueueCopy = [...prevCarQueue];
            let toUpdate = carQueueCopy.findIndex(c => c.scid === detection.scid);
            if (toUpdate >= 0) {
                carQueueCopy[toUpdate] = {
                    ...carQueueCopy[toUpdate],
                    status: 'out',
                    out_time: detection.timestamp
                }
            }
            return carQueueCopy
        })
    }

    const updateCarList = (detection: detection) => {
        if (detection.sf_order === 1) { // PRE ORDER
            if (detection.status.toLowerCase() === 'in') {
                const position = 'Pre-Order Point';
                setCarQueue((prevCarQueue: Car[]) => {
                    let carQueueCopy = [...prevCarQueue];
                    let fov_order = prevCarQueue.filter(c => c.position === position).length;
                    let index = prevCarQueue.length;
                    let scid_already_exists = !!prevCarQueue.find(d => d.scid === detection.scid);

                    if (!scid_already_exists) {
                        carQueueCopy.push({
                            position,
                            sf_order: detection.sf_order,
                            index: index + 1,
                            order: fov_order + 1,
                            status: 'in',
                            scid: detection.scid,
                            in_time: detection.timestamp,
                            out_time: null,
                            order_adjusted: false,
                            initialSetup: false
                        })
                    } else {
                        console.log('Scid Already Exist');
                    }
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
                    let scid_already_exists = !!carQueue.find(d => d.scid === detection.scid);

                    if (!scid_already_exists) {
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
                    } else {
                        console.log('Scid Already Exist');
                    }
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
                    let scid_already_exists = !!carQueue.find(d => d.scid === detection.scid);

                    if (!scid_already_exists) {
                        carQueueCopy[toUpdate] = {
                            ...carQueueCopy[toUpdate],
                            status: 'in',
                            position: position,
                            in_time: detection.timestamp,
                            scid: detection.scid,
                            order: fov_order + 1,
                            order_adjusted: false
                        }
                    } else {
                        console.log('Scid Already Exist');
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
                    let scid_already_exists = !!carQueue.find(d => d.scid === detection.scid);

                    if (!scid_already_exists) {
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
                    } else {
                        console.log('Scid Already Exist');
                    }
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

    const remove_from_initial_setup = (index: number) => {
        setCarQueue((prevCarQueue: Car[]) => {
            let carQueueCopy = [...prevCarQueue];
            carQueueCopy[index].initialSetup = false;
            return carQueueCopy
        })
    }

    return (
        <div className='absolute z-10 bg-transparent h-[66%] w-[85%]' style={{ right: 65, top: 0 }}>
            <img src={carPath} style={{ height: '100%', width: '100%', position: 'absolute' }} />
            {carQueue.map((c, i) => {
                return <Car
                    key={c.index}
                    scid={c.scid}
                    windowWidth={windowWidth}
                    windowHeight={windowHeight}
                    position={c.position}
                    order={c.order}
                    order_adjusted={c.order_adjusted}
                    index={c.index}
                    status={c.status}
                    sf_order={c.sf_order}
                    remove_from_queue={(index: number) => remove_from_queue(index)}
                    remove_from_initial_setup={(index: number) => remove_from_initial_setup(index)}
                    initialSetup={!!c.initialSetup}
                    carQueue={carQueue}
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