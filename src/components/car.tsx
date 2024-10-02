import { useState, useEffect } from 'react';
import { useSpring, animated, useSpringRef, useChain } from '@react-spring/web';
import '../css/root.css';

interface CarProps {
    windowWidth: number;
    windowHeight: number;
    position: string;
    index: number;
    order: number;
    dwell_time?: string;
    order_adjusted: boolean;
    status: string;
    remove_from_queue: (index: number) => void;
}

function Car({ windowWidth, windowHeight, index, position, order, order_adjusted, status, remove_from_queue }: CarProps) {
    const carWidth = 50;
    const carheight = 100;
    const [carLocation, setCarLocation] = useState({ x: windowWidth - carWidth, y: 0 });
    const [carTimer, setCarTimer] = useState('00:00:00');

    const [carAnimation, carController] = useSpring(() => ({
        from: { y: carLocation.y, x: carLocation.x, rotateZ: '0deg' }
    }))

    useEffect(() => {
        if (index <= 4) {
            moveToPreOrderPoint()
        }
    }, [])

    useEffect(() => {
        if (position === 'Order Point') {
            moveToOrderPoint()
        } else if (position === 'Service Queue Lane') {
            moveToServiceQueueLane()
        } else if (position === 'Pull Up Window') {
            moveToPullUpWindow()
        }
    }, [position])

    useEffect(() => { // THIS IS FOR ORDER ADJUSTMENT SO PREVIOUS CAR WILL MOVE TO FRONT WHEN A CAR LEAVES A ZONE
        if (position === 'Pre-Order Point' && order_adjusted) {
            const adjustment = order === 0 ? 0 : 10;
            const distance_between_cars = carheight + adjustment;
            carController.start({
                from: { y: carLocation.y, x: carLocation.x },
                to: async (next, cancel) => {
                    await next({ x: (windowWidth - (windowWidth * 0.32)) + (distance_between_cars * (order - 1)) })
                },
                onRest: (d) => {
                    setCarLocation({ x: d.value.x, y: d.value.y })
                },
                config: { duration: 1000 }
            })
        } else if (position === 'Service Queue Lane') {
            const adjustment = order === 0 ? 0 : 10;
            const distance_between_cars = carheight + adjustment;
            carController.start({
                from: { y: carLocation.y, x: carLocation.x },
                to: async (next) => {
                    await next({ x: windowWidth * 0.07 + (distance_between_cars * (order - 1)) })
                },
                config: { duration: 1000 },
                onRest: (d) => {
                    setCarLocation({ x: d.value.x, y: d.value.y })
                },
            })
        }
    }, [order])
    
    useEffect(() => {
        if (position === 'Pull Up Window' && status === 'out') {
            exitPathWay()
        }
    }, [status])

    const moveToPreOrderPoint = () => {
        const adjustment = order === 0 ? 0 : 10;
        const distance_between_cars = carheight + adjustment;
        carController.start({
            from: { y: 0, x: windowWidth - carWidth, rotateZ: '0deg' },
            to: async (next, cancel) => {
                await next({ y: windowHeight - carheight - (windowHeight * 0.01) })
                await next({ y: windowHeight - (carheight / 1.3), x: windowWidth - carWidth - (windowWidth * 0.04), rotateZ: '90deg' })
                await next({ x: (windowWidth - (windowWidth * 0.32)) + (distance_between_cars * (order - 1)) })
            },
            onRest: (d) => {
                setCarLocation({ x: d.value.x, y: d.value.y })
            },
            config: { duration: 1000 }
        })
    };

    const moveToOrderPoint = () => {
        carController.start({
            from: { y: carLocation.y, x: carLocation.x },
            to: async (next) => {
                await next({ x: windowWidth * 0.485 })
            },
            config: { duration: 1000 },
            onRest: (d) => {
                setCarLocation({ x: d.value.x, y: d.value.y })
            },
        })
    }

    const moveToServiceQueueLane = () => {
        const adjustment = order === 0 ? 0 : 10;
        const distance_between_cars = carheight + adjustment;
        carController.start({
            from: { y: carLocation.y, x: carLocation.x },
            to: async (next) => {
                await next({ x: windowWidth * 0.07 + (distance_between_cars * (order - 1)) })
            },
            config: { duration: 1500 },
            onRest: (d) => {
                setCarLocation({ x: d.value.x, y: d.value.y })
            },
        })
    }

    const moveToPullUpWindow = () => {
        carController.start({
            from: { y: carLocation.y, x: carLocation.x },
            to: async (next) => {
                await next({ y: windowHeight - (windowHeight * 0.135), x: windowWidth * 0.03, rotateZ: '105deg' })
                await next({ y: windowHeight - (windowHeight * 0.168), x: windowWidth * 0.015, rotateZ: '135deg' })
                await next({ y: windowHeight - (windowHeight * 0.2), x: windowWidth * 0.0056, rotateZ: '165deg' })
                await next({ y: windowHeight - (windowHeight * 0.25), x: windowWidth * 0.006, rotateZ: '180deg' })
            },
            config: { duration: 400 },
            onRest: (d) => {
                setCarLocation({ x: d.value.x, y: d.value.y })
            },
            onResolve: (d) => {
                carController.start({
                    from: { y: windowHeight - (windowHeight * 0.25), x: windowWidth * 0.006 },
                    to: async (next) => {
                        await next({ y: windowHeight - (windowHeight * 0.75)  })
                    },
                    config: { duration: 1000 },
                    onRest: (d) => {
                        setCarLocation({ x: d.value.x, y: d.value.y })
                    },
                })
            }
        })
    }

    const exitPathWay = () => {
        carController.start({
            from: { y: windowHeight - (windowHeight * 0.75)  },
            to: async (next) => {
                await next({ y: -100  })
            },
            config: { duration: 1000 },
            onResolve: () => {
                remove_from_queue(index)
            }
        })
    }

    useEffect(() => {
        const startTime: number = new Date().getTime();

        const interval = setInterval(() => {
            const currentTime: number = new Date().getTime();
            const elapsedTime: number = Math.floor((currentTime - startTime) / 1000);

            const hours: string = String(Math.floor(elapsedTime / 3600)).padStart(2, '0');
            const minutes: string = String(Math.floor((elapsedTime % 3600) / 60)).padStart(2, '0');
            const seconds: string = String(elapsedTime % 60).padStart(2, '0');

            setCarTimer(`${hours}:${minutes}:${seconds}`);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div>
            {index <= 4 &&
                <animated.div className="moving-car" style={carAnimation}>
                    <div
                        className={`absolute rounded centerize text-sm ${(position === 'Pre-Order Point' || position === 'Service Queue Lane') ? 'car-timer-black' : 'car-timer-yellow'}`}
                        style={{
                            height: 25,
                            width: 86,
                            left: 25,
                            top: 35,
                            fontFamily: 'monospace',
                        }}
                    >
                        {carTimer}
                    </div>
                </animated.div>
            }
        </div>
    )
}

export default Car