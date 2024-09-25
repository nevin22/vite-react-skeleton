import moment from 'moment';
import { useState, useEffect } from 'react';

import '../css/root.css';
import CarPath from '../components/carpath';

import sedanIcon from '../assets/sedan-model2.svg';
import orderPoint from '../assets/order-point.svg';
import pickupPoint from '../assets/pickup-point.svg';

import smileIcon from '../assets/face-happy.svg';
import sadIcon from '../assets/face-sad.svg';
import neutralIcon from '../assets/face-neutral.svg';

import themeProvider from '../utils/themeProvider';

interface Car {
    position: string;
    index: number;
    dwell_time: string;
}

function Root() {
    const [time, setTime] = useState(moment().format('hh:mm:ss A'));
    const [carsInLane, setCarsInLane] = useState<Car[]>([]);
    const [popCount, setPopCount] = useState<number>(0);
    const [sqlCount, setSqlCount] = useState<number>(0);

    useEffect(() => { // set score board time
        const interval = setInterval(() => {
            setTime(moment().format('hh:mm:ss A'));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const getCarsInLane = (carQueue: any) => {
        setCarsInLane(carQueue)
        setPopCount(carQueue.filter((d: any) => d.position === 'Pre-Order Point').length)
        setSqlCount(carQueue.filter((d: any) => d.position === 'Service Queue Lane').length)
        return carQueue
    }

    return (
        <div className={`flex justify-center aspect-w-16 aspect-h-9 items-center w-full bg-black relative ${themeProvider.main_bg}`}>
            <CarPath
                getCarsInLane={(c) => getCarsInLane(c)}
            />
            <div className='flex flex-col items-center h-full w-full pt-10'>
                <div className='flex flex-row w-[95%] h-[75%] space-x-2'>
                    <div className='flex w-[40%] h-[100%] flex-col space-y-2'>
                        <div className='flex flex-row justify-between rounded h-[43.8%] shadowed-left'>
                            <div className='flex justify-end text-white text-lg w-[30%]'>
                                <div className='mr-12 mt-5'>
                                    <span>PULL UP <br /> WINDOW</span>
                                </div>
                            </div>
                            <div className='w-[70%]'>
                                <div className='flex flex-col items-center'>
                                    <div className='text-2xl mt-5'>CURRENTLY SERVING</div>
                                    <div className='text-4xl mt-3' style={{ color: '#F3B64B' }}>00:01:23</div>
                                    <div className='mt-3'><img src={pickupPoint} style={{ width: 185 }} /></div>
                                    <div className='flex justify-center space-x-4 mt-2 w-[80%]'>
                                        <div className='text-sm w-[25%]' style={{ color: '#838B9B' }}>
                                            Minimum
                                            <div className='rounded scoreboard-green text-white py-1.5 text-center'>10s</div>
                                        </div>
                                        <div className='text-sm w-[25%]' style={{ color: '#838B9B' }}>
                                            Average
                                            <div className='rounded text-white py-1.5 text-center' style={{ backgroundColor: '#F3B64B' }}>1m 10s</div>
                                        </div>
                                        <div className='text-sm w-[25%]' style={{ color: '#838B9B' }}>
                                            Maximum
                                            <div className='rounded text-white py-1.5 text-center' style={{ backgroundColor: '#D21716' }}>5m 10s</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='flex justify-end h-[55%]'>
                            <div className='w-[66%] rounded shadowed'>
                                <div className='h-[90%] flex'>
                                    <div className='flex flex-col flex-1 items-center'>
                                        <div className='text-lg mt-5'>
                                            NEXT SERVING
                                        </div>
                                        <div className='text-4xl mt-7'>
                                            00:00:06
                                        </div>
                                        <div className='mt-8'>
                                            <img src={sedanIcon} style={{ width: 180 }} />
                                        </div>
                                    </div>
                                    <div className='flex flex-col flex-1 items-center'>
                                        <div className='text-lg mt-5'>
                                            SERVICE QUEUE <br />
                                            LENGTH
                                        </div>
                                        <div className={`rounded mt-5 w-[60%] h-[30%] text-4xl centerize ${sqlCount - 4 > 0 ? 'scoreboard-lightred' : 'scoreboard-lightgray'}`} style={{ color: sqlCount - 4 > 0 ? 'rgba(210, 23, 22, 1)' : '#49505E' }}>
                                            {carsInLane.filter(d => d.position === 'Service Queue Lane').length}
                                        </div>
                                    </div>
                                </div>
                                <div className='relative text-white text-xl text-center py-2 rounded-b' style={{ backgroundColor: sqlCount - 4 > 0 ? 'rgba(210, 23, 22, 0.8)' : '' }}>
                                    SERVICE QUEUE LANE
                                    {sqlCount - 4 > 0 &&
                                        <div className='absolute right-0 top-0 bg-white rounded-br centerize' style={{ height: 44, width: 44, color: 'rgba(210, 23, 22, 0.8)' }}>
                                            + {sqlCount - 4}
                                        </div>
                                    }
                                </div>

                            </div>
                        </div>
                    </div>
                    <div className='flex w-[27%] flex-col space-y-2'>
                        <div className={`rounded h-[13.7%] text-white ${themeProvider.date} text-2xl centerize`}>
                            {moment(new Date()).format('DD MMMM YYYY').toUpperCase()}
                        </div>
                        <div className='bg-white rounded h-[21.3%] text-2xl centerize flex'>
                            <div className='flex-1 centerize'>
                                CARS IN LANE
                            </div>
                            <div className='flex-1 h-full centerize'>
                                <div className='scoreboard-lightgray centerize rounded h-[60%] w-[40%] text-4xl' style={{ color: '#49505E' }}>
                                    {carsInLane.length}
                                </div>
                            </div>
                        </div>
                        <div className='rounded h-[65%] shadowed'>
                            <div className='h-[91%] flex flex-col items-center'>
                                <div className='text-2xl mt-5'>CURRENTLY ORDERING</div>
                                <div className='text-4xl mt-3' style={{ color: '#F3B64B' }}>00:01:23</div>
                                <div className='mt-3'><img src={orderPoint} style={{ width: 185 }} /></div>
                                <div className='flex justify-center space-x-4 mt-2 w-[80%]'>
                                    <div className='text-sm w-[25%]' style={{ color: '#838B9B' }}>
                                        Minimum
                                        <div className='rounded scoreboard-green text-white py-1.5 text-center'>10s</div>
                                    </div>
                                    <div className='text-sm w-[25%]' style={{ color: '#838B9B' }}>
                                        Average
                                        <div className='rounded text-white py-1.5 text-center' style={{ backgroundColor: '#F3B64B' }}>1m 10s</div>
                                    </div>
                                    <div className='text-sm w-[25%]' style={{ color: '#838B9B' }}>
                                        Maximum
                                        <div className='rounded text-white py-1.5 text-center' style={{ backgroundColor: '#D21716' }}>5m 10s</div>
                                    </div>
                                </div>
                            </div>
                            <div className='relative text-white text-xl text-center py-2 rounded-b'>
                                ORDER POINT
                            </div>
                        </div>
                    </div>
                    <div className='flex w-[27%] flex-col space-y-2'>
                        <div className={`text-white rounded h-[13.7%] ${themeProvider.time} text-2xl centerize`}>
                            {time}
                        </div>
                        <div className={`text-white rounded h-[28.75%] ${themeProvider.total} text-2xl flex justify-center pt-5`}>
                            <div className='flex flex-col items-center'>
                                <div>
                                    TOTAL SERVED
                                </div>
                                <div className='text-5xl pt-8'>
                                    2
                                </div>
                            </div>
                        </div>
                        <div className='rounded h-[55%] shadowed'>
                            <div className='h-[90%] flex'>
                                <div className='flex flex-col flex-1 items-center'>
                                    <div className='text-lg mt-5'>
                                        NEXT TO ORDER
                                    </div>
                                    <div className='text-4xl mt-7'>
                                        00:00:06
                                    </div>
                                    <div className='mt-8'>
                                        <img src={sedanIcon} style={{ width: 180 }} />
                                    </div>
                                </div>
                                <div className='flex flex-col flex-1 items-center'>
                                    <div className='text-lg mt-5'>
                                        PRE-ORDER <br />
                                        QUEUE LENGTH
                                    </div>
                                    <div className={`rounded mt-5 w-[60%] h-[30%] text-4xl centerize ${popCount - 4 > 0 ? 'scoreboard-lightred' : 'scoreboard-lightgray'}`} style={{ color: popCount - 4 > 0 ? 'rgba(210, 23, 22, 1)' : '#49505E' }}>
                                        {carsInLane.filter(d => d.position === 'Pre-Order Point').length}
                                    </div>
                                </div>
                            </div>
                            <div className='relative text-white text-xl text-center py-2 rounded-b' style={{ backgroundColor: popCount - 4 > 0 ? 'rgba(210, 23, 22, 0.8)' : '' }}>
                                PRE-ORDER POINT
                                {popCount - 4 > 0 &&
                                    <div className='absolute right-0 top-0 bg-white rounded-br centerize' style={{ height: 44, width: 44, color: 'rgba(210, 23, 22, 0.8)' }}>
                                        + {popCount - 4}
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </div>
                <div className='flex flex-row w-[95%] h-[25%] items-center'>
                    <div className='w-[25%] flex justify-center'>
                        <img src={themeProvider.main_logo} style={{ height: themeProvider.logo_height, marginTop: 40 }} />
                    </div>
                    <div className='flex flex-col w-full text-white'>
                        <div className='italic font-normal thin_color text-md mb-1'>DATA SUMMARY</div>
                        <div className='flex space-x-6'>
                            <div className='w-[55%] rounded summary-bg pt-2 pb-4'>
                                <div className='ml-7 mb-2 font-semibold'>
                                    SERVICE RATINGS
                                </div>
                                <div className='flex justify-between'>
                                    <div className='flex items-center ml-7'>
                                        <img src={smileIcon} className='mr-4' style={{ height: 40 }} />
                                        <div>
                                            <span className='text-xl'>66.49%</span>
                                            <div className='leading-3 mt-1'>
                                                <span className='text-sm font-semibold'>Quick Service</span>
                                                <br />
                                                <span className='text-sm font-thin italic thin_color'>less than 50s</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ height: 70, width: 1, backgroundColor: '#58636F' }} />
                                    <div className='flex items-center'>
                                        <img src={neutralIcon} className='mr-4' style={{ height: 40 }} />
                                        <div>
                                            <span className='text-xl'>18.96%</span>
                                            <div className='leading-3 mt-1'>
                                                <span className='text-sm font-semibold'>Fair Service</span>
                                                <br />
                                                <span className='text-sm font-thin italic thin_color'>between 50s to 80s</span>
                                            </div>

                                        </div>
                                    </div>
                                    <div style={{ height: 70, width: 1, backgroundColor: '#58636F' }} />
                                    <div className='flex items-center mr-7'>
                                        <img src={sadIcon} className='mr-4' style={{ height: 40 }} />
                                        <div>
                                            <span className='text-xl'>14.55%</span>
                                            <div className='leading-3 mt-1'>
                                                <span className='text-sm font-semibold'>Lengthly Service</span>
                                                <br />
                                                <span className='text-sm font-thin italic thin_color'>greater than 80s</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='w-[45%] rounded summary-bg pt-2 pb-4'>
                                <span className='ml-7 mb-2 font-semibold'>AVG DWELL TIME PER ZONE</span>
                                <div className='flex justify-between mx-7 mt-4'>
                                    <div>
                                        <span className='text-xl'>32.3s</span>
                                        <br />
                                        <span className='text-sm font-medium'>Pre-order Point</span>
                                    </div>
                                    <div>
                                        <span className='text-xl'>1m 45s</span>
                                        <br />
                                        <span className='text-sm font-medium'>Order Point</span>
                                    </div>
                                    <div>
                                        <span className='text-xl'>3m 28s</span>
                                        <br />
                                        <span className='text-sm font-medium'>Service Queue</span>
                                    </div>
                                    <div>
                                        <span className='text-xl'>1m 16s</span>
                                        <br />
                                        <span className='text-sm font-medium'>Pullup Window</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Root;