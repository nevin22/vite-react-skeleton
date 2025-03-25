export const convertToHoursMinutesSeconds = (time: string): string => {
    const [hours, minutes, seconds] = time.split(':').map(Number); // map number convert string to number so it will remove 0
    let result = '';
    if (hours > 0) {
        result += `${hours}h `;
    }
    result += `${minutes ? (minutes + 'm') : ''} ${seconds}s`;

    return result.trim();
}

export const timeStringToSeconds = (time: string): number => {
    let totalSeconds = 0;
    const minutesMatch = time.match(/(\d+)m/);
    const secondsMatch = time.match(/(\d+)s/);

    if (minutesMatch) {
        totalSeconds += parseInt(minutesMatch[1], 10) * 60;
    }

    if (secondsMatch) {
        totalSeconds += parseInt(secondsMatch[1], 10);
    }

    return totalSeconds;
}

export const compareTimes = (time1: string, time2: string): number => {
    const time1Seconds = timeStringToSeconds(time1);
    const time2Seconds = timeStringToSeconds(time2);

    if (time1Seconds > time2Seconds) {
        return 1;
    } else {
        return 0
    }
}

export const secondsToTimeString = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
  
    return `${ minutes ? (minutes + 'm') : ''} ${seconds}s`;
  }

export const averageTime = (time1: string, time2: string): string => {
    const time1Seconds = timeStringToSeconds(time1);
    const time2Seconds = timeStringToSeconds(time2);

    const averageSeconds = Math.floor((time1Seconds + time2Seconds) / 2);
    return secondsToTimeString(averageSeconds);
}


export const avg_dwell_time_converter = (time: number) => {
    if (time === 0) return "0"; // Handle zero case

    const h = Math.floor(time / 3600);
    const m = Math.floor((time % 3600) / 60);
    const s = time % 60; 
    const sFormatted = s === 0 ? "0" : s.toFixed(2); // Avoid "0.00"

    let result = [];
    if (h > 0) result.push(`${h}h`);
    if (m > 0) result.push(`${m}m`);
    if (s > 0 || result.length === 0) result.push(`${sFormatted}s`);

    return result.join(" ");
}