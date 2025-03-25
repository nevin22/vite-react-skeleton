import { useState, useEffect, useRef } from 'react';
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
    initialSetup: boolean;
    sf_order: number;
    scid: string;
    carQueue: any[];
    remove_from_queue: (index: number) => void;
    remove_from_initial_setup: (index: number) => void;
}

function Car({ windowWidth, windowHeight, index, position, order, order_adjusted, status, scid, initialSetup, sf_order, carQueue, remove_from_queue, remove_from_initial_setup }: CarProps) {
    const carWidth = 50;
    const carheight = 100;
    const [carTimer, setCarTimer] = useState('00:00:00');
    const carLocation = useRef<{ x: number, y: number }>({ x: windowWidth - carWidth, y: 0 })
    const [carAnimation, carController] = useSpring(() => {
        if (initialSetup) { // initial load of page. cars will pop up automatically no animation
            const adjustment = order === 0 ? 0 : 10;
            const distance_between_cars = carheight + adjustment;
            if (sf_order === 1) {
                carLocation.current = { y: windowHeight - (carheight / 1.3), x: (windowWidth - (windowWidth * 0.32)) + (distance_between_cars * (order - 1)) }
                return { from: { y: windowHeight - (carheight / 1.3), x: (windowWidth - (windowWidth * 0.32)) + (distance_between_cars * (order - 1)), rotateZ: '90deg' } }
            } else if (sf_order === 2) {
                carLocation.current = { y: windowHeight - (carheight / 1.3), x: windowWidth * 0.485 };
                return { from: { y: windowHeight - (carheight / 1.3), x: windowWidth * 0.485, rotateZ: '90deg' } }
            } else if (sf_order === 3) {
                carLocation.current = { y: windowHeight - (carheight / 1.3), x: windowWidth * 0.07 + (distance_between_cars * (order - 1)) };
                return { from: { y: windowHeight - (carheight / 1.3), x: windowWidth * 0.07 + (distance_between_cars * (order - 1)), rotateZ: '90deg' } }
            } else if (sf_order === 4) {
                carLocation.current = { y: windowHeight - (windowHeight * 0.25), x: windowWidth * 0.006, rotateZ: '180deg' };
                return { from: { y: windowHeight - (windowHeight * 0.25), x: windowWidth * 0.006, rotateZ: '180deg' } }
            }
        } else {
            return { from: { y: carLocation.current.y, x: carLocation.current.x, rotateZ: '0deg' } }
        }
    })

    const [isAnimating, setIsAnimating] = useState(false);
    const animationQueue = useRef<any[]>([]);
    const prevPositionRef = useRef<string | null>(null);

    useEffect(() => {
        if (initialSetup) {
            setTimeout(() => {
                remove_from_initial_setup(index - 1);
            }, 500)
        }
    }, [])

    useEffect(() => {
        // console.log(scid.substring(scid.length - 4),'-',carQueue)

        // dire ko mag add logic na if duwa na kabuok ang out sa isa ka FOV .. ma remove daun tong pinka first
    }, [carQueue])

    useEffect(() => {
        if (!initialSetup && prevPositionRef.current !== position) { // if dli initial setup ayha ra mag animate
            if (position === 'Pre-Order Point') {
                console.log('preorder order', order)
                if (order <= 4) {
                    setTimeout(() => { // set timeout kay naay bug sa pag initial render xD
                        moveToPreOrderPoint()
                    }, 100)
                }
            } else if (position === 'Order Point') {
                moveToOrderPoint()
            } else if (position === 'Service Queue Lane') {
                moveToServiceQueueLane()
            } else if (position === 'Pull Up Window') {
                moveToPullUpWindow()
            }
            prevPositionRef.current = position; // Update previous position
        }
    }, [position])

    useEffect(() => { // THIS IS FOR ORDER ADJUSTMENT SO PREVIOUS CAR WILL MOVE TO FRONT WHEN A CAR LEAVES A ZONE
        if (position === 'Pre-Order Point' && order_adjusted) {
            if (order === 4) {
                moveToPreOrderPoint()
            } else {
                const adjustment = order === 0 ? 0 : 10;
                const distance_between_cars = carheight + adjustment;
                const options = {
                    from: { y: carLocation.current.y, x: carLocation.current.x },
                    to: async (next: any) => {
                        await next({ x: (windowWidth - (windowWidth * 0.32)) + (distance_between_cars * (order - 1)) })
                    },
                    onRest: (d: any) => {
                        carLocation.current = { x: d.value.x, y: d.value.y }
                    },
                    config: { duration: 1000 }
                }

                if (isAnimating) { // if it's still animating, add the new animation to queue first
                    animationQueue.current.push(options)
                } else { // execute the animation immediately
                    carController.start(options)
                }
            }
        } else if (position === 'Service Queue Lane') {
            if (order === 4) {
                moveToServiceQueueLane(true) // via adjustment true so that it will have a prefedined location since ni kalit ramani sya sulpot
            } else {
                const adjustment = order === 0 ? 0 : 10;
                const distance_between_cars = carheight + adjustment;
                const options = {
                    from: { y: carLocation.current.y, x: carLocation.current.x },
                    to: async (next: any) => {
                        await next({ x: windowWidth * 0.07 + (distance_between_cars * (order - 1)) })
                    },
                    config: { duration: 1000 },
                    onRest: (d: any) => {
                        carLocation.current = { x: d.value.x, y: d.value.y }
                    },
                }

                if (isAnimating) { // if it's still animating, add the new animation to queue first
                    animationQueue.current.push(options)
                } else { // execute the animation immediately
                    carController.start(options)
                }
            }
        }
    }, [order])

    useEffect(() => {
        if (position === 'Pull Up Window' && status === 'out') {
            exitPathWay()
        }
    }, [status])

    const runQueuedAnimations = () => {
        if (!animationQueue.current.length) {
            setIsAnimating(false);
            return;
        }
        const animateNext = async () => {
            if (!animationQueue.current.length) {
                setIsAnimating(false);
                return;
            }
    
            const nextAnimation = animationQueue.current.shift();
            if (!nextAnimation) {
                setIsAnimating(false);
                return;
            };
    
            carController.start({
                ...nextAnimation,
                from: { y: carLocation.current.y, x: carLocation.current.x }
            });
    
            animateNext();
        };
    
        animateNext();
    };

    const moveToPreOrderPoint = () => {
        const adjustment = order === 0 ? 0 : 10;
        const distance_between_cars = carheight + adjustment;
        setIsAnimating(true)
        carController.start({
            from: { y: 0, x: windowWidth - carWidth, rotateZ: '0deg' },
            to: async (next) => {
                await next({ y: windowHeight - carheight - (windowHeight * 0.01) })
                await next({ y: windowHeight - (carheight / 1.3), x: windowWidth - carWidth - (windowWidth * 0.04), rotateZ: '90deg' })
                await next({ x: (windowWidth - (windowWidth * 0.32)) + (distance_between_cars * (order - 1)) })
            },
            onRest: (d) => {
                carLocation.current = { x: d.value.x, y: d.value.y };
            },
            onResolve: () => {
                if (animationQueue.current.length) {
                    runQueuedAnimations()
                } else {
                    setIsAnimating(false);
                }
            },
            config: { duration: 1000 }
        })
    };

    const moveToOrderPoint = () => {
        const options = {
            from: { y: carLocation.current.y, x: carLocation.current.x },
            to: async (next: any) => {
                await next({ x: windowWidth * 0.485 })
            },
            config: { duration: 1000 },
            onRest: (d: any) => {
                carLocation.current = { x: d.value.x, y: d.value.y }
            },
            onResolve: () => {
                if (animationQueue.current.length) {
                    runQueuedAnimations()
                } else {
                    setIsAnimating(false);
                }
            },
        }
        if (isAnimating) {
            animationQueue.current.push(options)
        } else {
            setIsAnimating(true)
            carController.start(options)
        }
    }

    const moveToServiceQueueLane = (viaAdjustment = false) => {
        const baseLocation = viaAdjustment ? { y: windowHeight - (carheight / 1.3), x: windowWidth * 0.485, rotateZ: '90deg' } : { y: carLocation.current.y, x: carLocation.current.x };
        const adjustment = order === 0 ? 0 : 10;
        const distance_between_cars = carheight + adjustment;
        const options = {
            from: baseLocation,
            to: async (next: any) => {
                await next({ x: windowWidth * 0.07 + (distance_between_cars * (order - 1)) })
            },
            config: { duration: 1500 },
            onRest: (d: any) => {
                carLocation.current = { x: d.value.x, y: d.value.y }
            },
            onResolve: () => {
                if (animationQueue.current.length) {
                    runQueuedAnimations()
                } else {
                    setIsAnimating(false);
                }
            },
        }

        if (isAnimating) {
            animationQueue.current.push(options)
        } else {
            setIsAnimating(true)
            carController.start(options)
        }
    }

    const moveToPullUpWindow = () => {
        const options = {
            from: { y: carLocation.current.y, x: carLocation.current.x },
            to: async (next: any) => {
                await next({ y: windowHeight - (windowHeight * 0.135), x: windowWidth * 0.03, rotateZ: '105deg' })
                await next({ y: windowHeight - (windowHeight * 0.168), x: windowWidth * 0.015, rotateZ: '135deg' })
                await next({ y: windowHeight - (windowHeight * 0.2), x: windowWidth * 0.0056, rotateZ: '165deg' })
                await next({ y: windowHeight - (windowHeight * 0.25), x: windowWidth * 0.006, rotateZ: '180deg' })
            },
            config: { duration: 400 },
            onRest: (d: any) => {
                carLocation.current = { x: d.value.x, y: d.value.y }
            },
            onResolve: () => {
                if (animationQueue.current.length) {
                    runQueuedAnimations()
                } else {
                    setIsAnimating(false);
                }
                carController.start({
                    from: { y: windowHeight - (windowHeight * 0.25), x: windowWidth * 0.006 },
                    to: async (next) => {
                        await next({ y: windowHeight - (windowHeight * 0.75) })
                    },
                    config: { duration: 1000 },
                    onRest: (d) => {
                        carLocation.current = { x: d.value.x, y: d.value.y }
                    },
                })
            }
        }

        if (isAnimating) {
            animationQueue.current.push(options)
        } else {
            setIsAnimating(true)
            carController.start(options)
        }
    }

    const exitPathWay = () => {
        carController.start({
            from: { y: windowHeight - (windowHeight * 0.75) },
            to: async (next) => {
                await next({ y: -100 })
            },
            config: { duration: 1000 },
            onResolve: () => {
                remove_from_queue(index)
            }
        })
    }

    // useEffect(() => {
    //     const startTime: number = new Date().getTime();

    //     const interval = setInterval(() => {
    //         const currentTime: number = new Date().getTime();
    //         const elapsedTime: number = Math.floor((currentTime - startTime) / 1000);

    //         const hours: string = String(Math.floor(elapsedTime / 3600)).padStart(2, '0');
    //         const minutes: string = String(Math.floor((elapsedTime % 3600) / 60)).padStart(2, '0');
    //         const seconds: string = String(elapsedTime % 60).padStart(2, '0');

    //         setCarTimer(`${hours}:${minutes}:${seconds}`);
    //     }, 1000);

    //     return () => clearInterval(interval);
    // }, []);

    return (
        <div>
            {order <= 4 &&
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
                        {/* {carTimer} */}
                        {status} - {scid.substring(scid.length - 4)}
                    </div>
                </animated.div>
            }
        </div>
    )
}

export default Car