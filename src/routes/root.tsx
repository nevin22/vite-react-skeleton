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
import {convertToHoursMinutesSeconds, compareTimes, averageTime, avg_dwell_time_converter} from '../utils/utilityFunctions';

interface Car {
    position: string;
    index: number;
    dwell_time: string;
    in_time: number;
    out_time: number;
}

interface metrics {
    average_dwell_ent: number;
    average_dwell_op: number;
    average_dwell_queue: number;
    average_dwell_puw: number;
}

function Root() {
    const [time, setTime] = useState(moment().format('hh:mm:ss A'));
    const [metrics, setMetrics] = useState<metrics | null>(null)
    const [carsInLane, setCarsInLane] = useState<Car[]>([]);
    const [popCount, setPopCount] = useState<number>(0);
    const [sqlCount, setSqlCount] = useState<number>(0);

    const [nextToOrder, setNextToOrder] = useState<number | null>(null)
    const [currentlyOrdering, setCurrentlyOrdering] = useState<number | null>(null)
    const [nextServing, setNextServing] = useState<number | null>(null)
    const [currentlyServing, setCurrentlyServing] = useState<number | null>(null)

    const [nto_time, set_nto_time] = useState<string>('00:00:00')
    const [co_time, set_co_time] = useState<string>('00:00:00')
    const [ns_time, set_ns_time] = useState<string>('00:00:00')
    const [cs_time, set_cs_time] = useState<string>('00:00:00')

    let nextToOderIntervalId: NodeJS.Timeout | null = null;
    let co_interval_id: NodeJS.Timeout | null = null;
    let ns_interval_id: NodeJS.Timeout | null = null;
    let cs_interval_id: NodeJS.Timeout | null = null;

    const [cs_minimum, set_cs_minimum] = useState<string>('0s');
    const [cs_average, set_cs_average] = useState<string>('0s');
    const [cs_maximum, set_cs_maximum] = useState<string>('0s');

    const [co_minimum, set_co_minimum] = useState<string>('0s');
    const [co_average, set_co_average] = useState<string>('0s');
    const [co_maximum, set_co_maximum] = useState<string>('0s');

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

    useEffect(() => {
        setNextToOrder(carsInLane.filter(car => car.position === 'Pre-Order Point')[0]?.in_time)

        if (carsInLane.filter(car => car.position === 'Order Point')[0]?.in_time !== currentlyOrdering) {
            setCurrentlyOrdering(carsInLane.filter(car => car.position === 'Order Point')[0]?.in_time)
        }

        setNextServing(carsInLane.filter(car => car.position === 'Service Queue Lane')[0]?.in_time)
        setCurrentlyServing(carsInLane.filter(car => car.position === 'Pull Up Window')[0]?.in_time)
    }, [carsInLane])
    
    const getTimeString = (timestamp: number) => {
        const now = moment();
        const ts = moment(Number(timestamp))
        const duration = moment.duration(now.diff(ts));
        
        const hours = String(Math.floor(duration.asHours())).padStart(2, '0');
        const minutes = String(duration.minutes()).padStart(2, '0');
        const seconds = String(duration.seconds()).padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`
    }

    useEffect(() => {
        if (nextToOrder !== null) {
            nextToOderIntervalId = setInterval(() => {
                if (nextToOrder) {
                    set_nto_time(getTimeString(nextToOrder))
                }
          }, 1000);
        }

        return () => {
          if (nextToOderIntervalId) {
            set_nto_time('00:00:00')
            clearInterval(nextToOderIntervalId);
          }
        };
      }, [nextToOrder]);

      useEffect(() => {
        if (currentlyOrdering !== null) {
            co_interval_id = setInterval(() => {
                if (currentlyOrdering) {
                    set_co_time(getTimeString(currentlyOrdering))
                }
          }, 1000);
        }

        return () => {
          if (co_interval_id) {
            set_co_time((prev_co_time) => {
                // console.log('currentlyOrdering', currentlyOrdering)
                if (currentlyOrdering) {
                    let converted_co_time = convertToHoursMinutesSeconds(prev_co_time);

                    if (co_maximum !== '0s' && co_average === '0s') {
                        set_co_average(averageTime(co_maximum, converted_co_time))
                    } else if (co_average !== '0s') {
                        set_co_average((prev_value) => averageTime(prev_value, converted_co_time))
                    }

                    set_co_minimum(min_prev_value => {
                        if ((min_prev_value === '0s' && co_maximum !== '0s') || compareTimes(min_prev_value, converted_co_time)) {
                            return converted_co_time
                        } else {
                            return min_prev_value
                        }
                    })

                    set_co_maximum((max_prev_value) => {
                        if (max_prev_value === '0s' || compareTimes(converted_co_time, max_prev_value)) {
                            return converted_co_time
                        } else {
                            return max_prev_value
                        }
                    });

                    // setTimeout(() => {
                    //     if (co_maximum !== '0s' && co_minimum !== '0s') {
                    //         set_co_average((prev_value) => averageTime(prev_value, converted_co_time))
                    //     }
                    // }, 150)
                    
                }         
                return '00:00:00'
            })
            clearInterval(co_interval_id);
          }
        };
      }, [currentlyOrdering]);

      useEffect(() => {
        if (nextServing !== null) {
            ns_interval_id = setInterval(() => {
                if (nextServing) {
                    set_ns_time(getTimeString(nextServing))
                }
          }, 1000);
        }

        return () => {
          if (ns_interval_id) {
            set_ns_time('00:00:00')
            clearInterval(ns_interval_id);
          }
        };
      }, [nextServing]);

      useEffect(() => {
        if (currentlyServing !== null) {
            cs_interval_id = setInterval(() => {
                if (currentlyServing) {
                    set_cs_time(getTimeString(currentlyServing))
                }
          }, 1000);
        }

        return () => {
          if (cs_interval_id) {
            set_cs_time('00:00:00')
            clearInterval(cs_interval_id);
          }
        };
      }, [currentlyServing]);

    return (
        <div className={`flex justify-center aspect-w-16 aspect-h-9 items-center w-full bg-black relative ${themeProvider.main_bg}`}>
            <CarPath
                getCarsInLane={(c) => getCarsInLane(c)}
                getMetrics={(metrics) => setMetrics(metrics)}
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
                                    <div className='text-4xl mt-3' style={{ color: '#F3B64B' }}>{cs_time}</div>
                                    <div className='mt-3'><img src={pickupPoint} style={{ width: 185 }} /></div>
                                    <div className='flex justify-center space-x-4 mt-2 w-[80%]'>
                                        <div className='text-sm w-[25%]' style={{ color: '#838B9B' }}>
                                            Minimum
                                            <div className='rounded scoreboard-green text-white py-1.5 text-center'>{cs_minimum}</div>
                                        </div>
                                        <div className='text-sm w-[25%]' style={{ color: '#838B9B' }}>
                                            Average
                                            <div className='rounded text-white py-1.5 text-center' style={{ backgroundColor: '#F3B64B' }}>{cs_average}</div>
                                        </div>
                                        <div className='text-sm w-[25%]' style={{ color: '#838B9B' }}>
                                            Maximum
                                            <div className='rounded text-white py-1.5 text-center' style={{ backgroundColor: '#D21716' }}>{cs_maximum}</div>
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
                                            {ns_time}
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
                            {moment().format('DD MMMM YYYY').toUpperCase()}
                        </div>
                        <div className='bg-white rounded h-[21.3%] text-2xl centerize flex'>
                            <div className='flex-1 centerize' style={{ zIndex: 100000 }} onClick={() => console.log(carsInLane)}>
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
                                <div className='text-4xl mt-3' style={{ color: '#F3B64B' }}>{co_time}</div>
                                <div className='mt-3'><img src={orderPoint} style={{ width: 185 }} /></div>
                                <div className='flex justify-center space-x-4 mt-2 w-[80%]'>
                                    <div className='text-sm w-[25%]' style={{ color: '#838B9B' }}>
                                        Minimum
                                        <div className='rounded scoreboard-green text-white py-1.5 text-center'>{co_minimum}</div>
                                    </div>
                                    <div className='text-sm w-[25%]' style={{ color: '#838B9B' }}>
                                        Average
                                        <div className='rounded text-white py-1.5 text-center' style={{ backgroundColor: '#F3B64B' }}>{co_average}</div>
                                    </div>
                                    <div className='text-sm w-[25%]' style={{ color: '#838B9B' }}>
                                        Maximum
                                        <div className='rounded text-white py-1.5 text-center' style={{ backgroundColor: '#D21716' }}>{co_maximum}</div>
                                    </div>
                                </div>
                            </div>
                            <div className='relative text-white text-xl text-center py-2 rounded-b'>
                                ORDER POINT
                            </div>
                        </div>
                    </div>
                    <div className='flex w-[27%] flex-col space-y-2'>
                        <div className={`text-white rounded h-[13.8%] ${themeProvider.time} text-2xl centerize`}>
                            {time}
                        </div>
                        <div className={`text-white rounded h-[28.75%] ${themeProvider.total} text-2xl flex justify-center pt-5`}>
                            <div className='flex flex-col items-center'>
                                <div>
                                    TOTAL SERVED
                                </div>
                                <div className='text-5xl pt-8'>
                                    0
                                </div>
                            </div>
                        </div>
                        <div className='rounded h-[58%] shadowed'>
                            <div className='h-[90%] flex'>
                                <div className='flex flex-col flex-1 items-center'>
                                    <div className='text-lg mt-5'>
                                        NEXT TO ORDER
                                    </div>
                                    <div className='text-4xl mt-7'>
                                        {nto_time}
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
                                        <span className='text-xl'>{avg_dwell_time_converter(metrics?.average_dwell_ent ?? 0)}</span>
                                        <br />
                                        <span className='text-sm font-medium'>Pre-order Point</span>
                                    </div>
                                    <div>
                                        <span className='text-xl'>{avg_dwell_time_converter(metrics?.average_dwell_op ?? 0)}</span>
                                        <br />
                                        <span className='text-sm font-medium'>Order Point</span>
                                    </div>
                                    <div>
                                        <span className='text-xl'>{avg_dwell_time_converter(metrics?.average_dwell_queue ?? 0)}</span>
                                        <br />
                                        <span className='text-sm font-medium'>Service Queue</span>
                                    </div>
                                    <div>
                                        <span className='text-xl'>{avg_dwell_time_converter(metrics?.average_dwell_puw ?? 0)}</span>
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