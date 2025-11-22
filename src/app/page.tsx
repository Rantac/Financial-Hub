

'use client';

import {useState, useEffect, useRef, useCallback} from 'react';
import { Button } from '@/components/ui/button';
import { Check, Circle, Trash, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


// Import new icons
import FinanceHubLogoIcon from '@/components/icons/FinanceHubLogoIcon';
import CurrencyCircleDollarIcon from '@/components/icons/CurrencyCircleDollarIcon';
import CurrencyBtcIcon from '@/components/icons/CurrencyBtcIcon';
import ChartLineIcon from '@/components/icons/ChartLineIcon';
import NoteIcon from '@/components/icons/NoteIcon';
import MagnifyingGlassIcon from '@/components/icons/MagnifyingGlassIcon';

interface Task {
    id: string;
    description: string;
    completed: boolean;
}

interface FomcMeeting {
  month: string;
  startDay: number;
  endDay: number;
}

const fomcMeetingDates: FomcMeeting[] = [
  { month: 'Jan', startDay: 28, endDay: 29 },
  { month: 'Mar', startDay: 18, endDay: 19 },
  { month: 'May', startDay: 6, endDay: 7 },
  { month: 'Jun', startDay: 17, endDay: 18 },
  { month: 'Jul', startDay: 29, endDay: 30 },
  { month: 'Sep', startDay: 16, endDay: 17 },
  { month: 'Oct', startDay: 28, endDay: 29 },
  { month: 'Dec', startDay: 9, endDay: 10 },
];

function getMonthIndex(monthName: string): number {
  const monthMap: {[key: string]: number} = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };
  return monthMap[monthName.slice(0,3)];
}

type ActiveSection = 'notes' | 'lots' | 'crypto' | 'market' | null;

export default function Home() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const {toast} = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const [fomcDateString, setFomcDateString] = useState('');
    const [activeSection, setActiveSection] = useState<ActiveSection>('notes');


    // Lots Calculator State
    const [lotsAccountBalance, setLotsAccountBalance] = useState('');
    const [lotsRiskPct, setLotsRiskPct] = useState('');
    const [lotsPair, setLotsPair] = useState('EURUSD');
    const [lotsEntryPrice, setLotsEntryPrice] = useState('');
    const [lotsSlPrice, setLotsSlPrice] = useState('');
    const [lotsTpPrice, setLotsTpPrice] = useState('');
    const [lotsConversionPrice, setLotsConversionPrice] = useState('');
    const [lotsResult, setLotsResult] = useState({
      standardLots: 0,
      riskPips: 0,
      rewardPips: 0,
      rRatio: 0,
      riskAmount: 0,
    });
    const [calculationMode, setCalculationMode] = useState('Direct');
    const [conversionPair, setConversionPair] = useState('');
    const [isFetchingConversion, setIsFetchingConversion] = useState(false);
    const [conversionError, setConversionError] = useState<string | null>(null);


    // Crypto Position Sizing Calculator State
    const [cryptoEntry, setCryptoEntry] = useState('');
    const [cryptoSL, setCryptoSL] = useState('');
    const [cryptoTP, setCryptoTP] = useState('');
    const [riskPercentage, setRiskPercentage] = useState('');
    const [positionSize, setPositionSize] = useState<number | null>(null);
    const [accountBalance, setAccountBalance] = useState('');
    const [cryptoRiskRewardRatio, setCryptoRiskRewardRatio] = useState<number | null>(null);


    // Market Price State
    const [loadingMarket, setLoadingMarket] = useState(false);
    const [errorMarket, setErrorMarket] = useState<string | null>(null);
    
    type CoinSymbol = "BTC" | "ETH" | "BNB" | "SOL" | "TON" | "LTC" | "XRP" | "XLM" | "LINK";
    const initialCoinPrices: Record<CoinSymbol, number | null> = {
        BTC: null, ETH: null, BNB: null, SOL: null, TON: null, LTC: null, XRP: null, XLM: null, LINK: null,
    };
    const [coinPrices, setCoinPrices] = useState<Record<CoinSymbol, number | null>>(initialCoinPrices);
    const [waitingPrices, setWaitingPrices] = useState<Record<CoinSymbol, string | null>>(initialCoinPrices as Record<CoinSymbol, string | null>);

    const [isClientMobile, setIsClientMobile] = useState(false);

    useEffect(() => {
      if (typeof navigator !== 'undefined') {
        setIsClientMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
      }
    }, []);

    const getStatus = (coin: CoinSymbol) => {
        const marketPrice = coinPrices[coin] || 0;
        const waitingPrice = waitingPrices[coin] || '';

        if (!marketPrice || !waitingPrice) return null;

        const [lowStr, highStr] = waitingPrice.split('-').map(s => s.trim());
        const low = parseFloat(lowStr);
        const high = parseFloat(highStr);

        if (isNaN(low) || isNaN(high)) return 'Invalid range';

        if (marketPrice > high) {
            return 'Above';
        } else if (marketPrice < low) {
            return 'Below';
        } else {
            return 'Within';
        }
    };
    
    const requestNotificationPermission = async () => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                try {
                    const permission = await Notification.requestPermission();
                    console.log(`Notification permission ${permission}.`);
                } catch (error) {
                    console.error("Error requesting notification permission:", error);
                }
            } else if (Notification.permission === 'granted') {
                console.log("Notification permission already granted.");
            } else {
                console.log("Notification permission denied or not supported.");
            }
        }
    };

    useEffect(() => {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            setTasks(JSON.parse(storedTasks));
        }

        const storedWaitingPrices = localStorage.getItem('waitingPrices');
        if (storedWaitingPrices) {
            setWaitingPrices(JSON.parse(storedWaitingPrices));
        }
        
        requestNotificationPermission();

        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => console.log('Service Worker registered with scope:', registration.scope))
                .catch(error => console.error('Service worker registration failed:', error));
        }

    }, []);

    useEffect(() => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        localStorage.setItem('waitingPrices', JSON.stringify(waitingPrices));
    }, [waitingPrices]);


    useEffect(() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      const currentYear = today.getFullYear();
    
      let upcomingMeetingData: { month: string; startDay: number; endDay: number; year: number } | null = null;
    
      for (const meeting of fomcMeetingDates) {
        const meetingEndDate = new Date(currentYear, getMonthIndex(meeting.month), meeting.endDay, 23, 59, 59, 999);
        if (meetingEndDate >= today) {
          upcomingMeetingData = { ...meeting, year: currentYear };
          break; 
        }
      }
    
      if (!upcomingMeetingData && fomcMeetingDates.length > 0) {
        upcomingMeetingData = { ...fomcMeetingDates[0], year: currentYear + 1 };
      }
    
      if (upcomingMeetingData) {
        setFomcDateString(`FOMC: ${upcomingMeetingData.month} ${upcomingMeetingData.startDay}-${upcomingMeetingData.endDay}`);
      } else {
        setFomcDateString('FOMC: TBD');
      }
    }, []);


    const handleAddTask = async () => {
        if (newTaskDescription.trim() !== '') {
            try {
                const newTask: Task = {
                    id: Date.now().toString(),
                    description: newTaskDescription,
                    completed: false,
                };
                setTasks([...tasks, newTask]);
                setNewTaskDescription('');
                inputRef.current?.focus(); 
                toast({
                    title: 'Task Added!',
                    description: 'Your task has been successfully added to the list.',
                });
            } catch (error: any) {
                toast({
                    title: 'Error adding task',
                    description: error.message,
                    variant: 'destructive',
                });
            }
        } else {
            toast({
                title: 'Error',
                description: 'Task description cannot be empty.',
                variant: 'destructive',
            });
        }
    };

    const handleCompleteTask = (id: string) => {
        setTasks(
            tasks.map((task) =>
                task.id === id ? {...task, completed: !task.completed} : task
            )
        );
    };

    const handleDeleteTask = (id: string) => {
        setTasks(tasks.filter((task) => task.id !== id));
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleAddTask();
        }
    };

    // --- Lots Calculator Logic ---
    const getPairDetails = (pair: string) => {
        const base = pair.substring(0, 3);
        const quote = pair.substring(3, 6);
        const isJpy = pair.includes('JPY');
        const isGold = pair.includes('XAU');
        let pipSize = isJpy ? 0.01 : 0.0001;
        if (isGold) pipSize = 0.01;
        return { base, quote, pipSize };
    };

    const determineCalculationMode = (accCurr: string, base: string, quote: string) => {
        if (quote === accCurr) return 'Direct';
        if (base === accCurr) return 'Indirect';
        return 'Cross';
    };

    const calculateLots = useCallback(() => {
        const { base, quote, pipSize } = getPairDetails(lotsPair);
        const mode = determineCalculationMode('USD', base, quote);

        const balance = parseFloat(lotsAccountBalance) || 0;
        const riskPct = parseFloat(lotsRiskPct) || 0;
        const price = parseFloat(lotsEntryPrice) || 0;
        const sl = parseFloat(lotsSlPrice) || 0;
        const tp = parseFloat(lotsTpPrice) || 0;
        const convPrice = parseFloat(lotsConversionPrice) || 0;

        if (balance === 0 || riskPct === 0 || price === 0 || sl === 0) {
            setLotsResult({ standardLots: 0, riskPips: 0, rewardPips: 0, rRatio: 0, riskAmount: 0 });
            return;
        }

        const riskAmount = balance * (riskPct / 100);
        const stdLotSize = 100000;

        let slPips = Math.abs(price - sl) / pipSize;
        let tpPips = tp > 0 ? Math.abs(tp - price) / pipSize : 0;

        let pipValueStandard = 0;
        const rawPipValueQuote = pipSize * stdLotSize;

        if (mode === 'Direct') {
            pipValueStandard = rawPipValueQuote;
        } else if (mode === 'Indirect') {
             if (price > 0) pipValueStandard = rawPipValueQuote / price;
        } else if (mode === 'Cross') {
            if (convPrice > 0) {
                pipValueStandard = rawPipValueQuote * convPrice;
            }
        }
        
        let lots = 0;
        if (slPips > 0 && pipValueStandard > 0) {
            lots = riskAmount / (slPips * pipValueStandard);
        }

        let rRatio = 0;
        if (tpPips > 0 && slPips > 0) {
            rRatio = tpPips / slPips;
        }

        setLotsResult({
            standardLots: lots,
            riskPips: slPips,
            rewardPips: tpPips,
            rRatio: rRatio,
            riskAmount: riskAmount,
        });
    }, [lotsPair, lotsAccountBalance, lotsRiskPct, lotsEntryPrice, lotsSlPrice, lotsTpPrice, lotsConversionPrice]);

    
    const fetchConversionRate = useCallback(async (pairForApi: string) => {
        setIsFetchingConversion(true);
        setConversionError(null);
        setLotsConversionPrice('');
        const apiKey = 'd4g3l59r01qgiieo4v7gd4g3l59r01qgiieo4v80';
        const url = `https://finnhub.io/api/v1/quote?symbol=OANDA:${pairForApi}&token=${apiKey}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            const data = await response.json();
            if (data.c) {
                setLotsConversionPrice(data.c.toString());
            } else {
                throw new Error('Invalid data format from API.');
            }
        } catch (error: any) {
            setConversionError(error.message);
            toast({
                title: 'API Error',
                description: `Could not fetch exchange rate for ${pairForApi}.`,
                variant: 'destructive',
            });
        } finally {
            setIsFetchingConversion(false);
        }
    }, [toast]);

    useEffect(() => {
        const { base, quote } = getPairDetails(lotsPair);
        const mode = determineCalculationMode('USD', base, quote);
        setCalculationMode(mode);
        setConversionError(null);

        if (mode === 'Cross') {
            const pairForApi = `${quote}_USD`;
            setConversionPair(`${quote}/USD`);
            fetchConversionRate(pairForApi);
        } else if (mode === 'Indirect') {
            setConversionPair('');
            setLotsConversionPrice(''); // Not needed, but clear it
        } else { // Direct
            setConversionPair('');
            setLotsConversionPrice('');
        }
    }, [lotsPair, fetchConversionRate]);


    useEffect(() => {
        calculateLots();
    }, [lotsAccountBalance, lotsRiskPct, lotsPair, lotsEntryPrice, lotsSlPrice, lotsTpPrice, lotsConversionPrice, calculateLots]);

    const handlePairChange = (value: string) => {
        setLotsPair(value);
        setLotsEntryPrice('');
        setLotsSlPrice('');
        setLotsTpPrice('');
        setLotsConversionPrice('');
    };


     const calculateCryptoValues = () => {
        if (!cryptoEntry || !cryptoSL || !accountBalance) {
            setPositionSize(null);
            setCryptoRiskRewardRatio(null); 
            return;
        }
    
        const entryPrice = parseFloat(cryptoEntry);
        const stopLossPrice = parseFloat(cryptoSL);
        const accountValue = parseFloat(accountBalance);
        const riskPct = riskPercentage ? parseFloat(riskPercentage) / 100 : null; 
    
        if (isNaN(entryPrice) || isNaN(stopLossPrice) || isNaN(accountValue) || (riskPercentage && isNaN(riskPct!))) {
            setPositionSize(null);
            setCryptoRiskRewardRatio(null);
            return;
        }
    
        if (riskPct !== null && riskPct > 0) {
            const riskAmount = accountValue * riskPct;
            const priceDifferenceForSL = Math.abs(entryPrice - stopLossPrice);
            if (priceDifferenceForSL > 0) {
                const calculatedPositionSize = riskAmount / priceDifferenceForSL;
                setPositionSize(calculatedPositionSize);
            } else {
                setPositionSize(null); 
            }
        } else {
            setPositionSize(null); 
        }
    
        if (cryptoTP) {
            const takeProfitPrice = parseFloat(cryptoTP);
            if (!isNaN(takeProfitPrice)) {
                const risk = Math.abs(entryPrice - stopLossPrice);
                const reward = Math.abs(takeProfitPrice - entryPrice);
                if (risk > 0) {
                    const ratio = reward / risk;
                    setCryptoRiskRewardRatio(ratio);
                } else {
                    setCryptoRiskRewardRatio(null); 
                }
            } else {
                setCryptoRiskRewardRatio(null); 
            }
        } else {
            setCryptoRiskRewardRatio(null); 
        }
    };
    
    useEffect(() => {
        calculateCryptoValues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cryptoEntry, cryptoSL, cryptoTP, riskPercentage, accountBalance]);

    const fetchMarketData = useCallback(async () => {
        setLoadingMarket(true);
        setErrorMarket(null); 
        try {
            const url = 'https://coinranking1.p.rapidapi.com/coins?referenceCurrencyUuid=yhjMzLPhuIDl&timePeriod=24h&tiers=1&orderBy=marketCap&orderDirection=desc&limit=50&offset=0';
            const options = {
                method: 'GET',
                headers: {
                    'x-rapidapi-key': 'f0ad4a4797msh17ff46665ba9c66p1e5399jsnd422cb1c94df',
                    'x-rapidapi-host': 'coinranking1.p.rapidapi.com'
                }
            };
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorMessage = `HTTP error! status: ${response.status}`;
                setErrorMarket(errorMessage);
                console.error("Market Price Fetch Error:", errorMessage); 
                throw new Error(errorMessage);
            }
            const result = await response.json();
            
            const coinsToFetch: CoinSymbol[] = ["BTC", "ETH", "BNB", "SOL", "TON", "LTC", "XRP", "XLM", "LINK"];
            const newCoinPrices: Record<CoinSymbol, number | null> = {...initialCoinPrices};
            let anErrorOccurred = false;

            coinsToFetch.forEach(symbol => {
                const coinData = result.data.coins.find((c: any) => c.symbol === symbol);
                if (coinData && coinData.price) { 
                    newCoinPrices[symbol] = parseFloat(coinData.price);
                } else {
                    console.error(`${symbol} price not found or invalid in API response.`);
                    anErrorOccurred = true;
                }
            });
            setCoinPrices(newCoinPrices);

            if (anErrorOccurred) {
                setErrorMarket(prevError => {
                    const newErrorMessage = "Some coin prices not found or invalid.";
                    if (prevError && !prevError.includes(newErrorMessage)) return `${prevError}, ${newErrorMessage}`;
                    return newErrorMessage;
                });
            }

        } catch (e: any) {
            setErrorMarket(e.message);
            console.error("Market Price Fetch API Error:", e);
        } finally {
            setLoadingMarket(false);
        }
    }, []);

    useEffect(() => {
        if (activeSection === 'market') {
          fetchMarketData();
          const intervalId = setInterval(fetchMarketData, 1200000); 
          return () => clearInterval(intervalId); 
        }
    }, [activeSection, fetchMarketData]);

    const sendNotification = (coin: string, price: number) => {
        const commonIcon = '/favicon.ico';
    
        console.log("Attempting to send notification...");
    
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                console.log("Notification permission granted.");
                if (isClientMobile) {
                    const mobileNotificationTitle = 'Financial Hub Alert!'; 
                    const mobileNotificationOptions = {
                        body: `${coin} is within your set range at $${price.toFixed(2)}. Time to check!`,
                        icon: commonIcon,
                    };
                    console.log("Mobile device detected. Using Service Worker for notification.");
                    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                        navigator.serviceWorker.ready.then(registration => {
                            console.log("Service Worker is ready. Attempting to show notification.");
                            registration.showNotification(mobileNotificationTitle, mobileNotificationOptions)
                                .then(() => console.log('Notification sent via Service Worker.'))
                                .catch(err => console.error('Service Worker notification error:', err));
                        }).catch(error => {
                            console.error("Service Worker ready error:", error);
                        });
                    } else {
                        console.warn('Service Worker not available, not ready, or not controlling the page for mobile notification. Trying direct Notification API.');
                         try {
                            new Notification(mobileNotificationTitle, mobileNotificationOptions); 
                            console.log('Fallback: Notification sent via Notification API on mobile.');
                        } catch (err) {
                            console.error('Fallback: Mobile Notification API error:', err);
                        }
                    }
                } else { 
                    console.log("Desktop device detected. Using Notification API.");
                    const desktopNotificationTitle = `Financial Hub Alert: ${coin} Price Update!`; 
                    const desktopNotificationOptions = {
                        body: `${coin} has reached $${price.toFixed(2)} and is within your specified alert range. Consider reviewing your position.`, 
                        icon: commonIcon, 
                    };
                    try {
                        new Notification(desktopNotificationTitle, desktopNotificationOptions);
                        console.log('Notification sent via Notification API for desktop.');
                    } catch (err) {
                        console.error('Desktop Notification API error:', err);
                    }
                }
            } else if (Notification.permission === 'denied') {
                console.warn('Notification permission denied by user.');
            } else {
                console.log('Notification permission is default. Requesting permission again just in case.');
                requestNotificationPermission(); 
            }
        } else {
            console.warn('Notifications not supported in this browser or window context.');
        }
    };
    

    useEffect(() => {
        console.log("Checking waiting prices trigger effect...");
        const checkWaitingPrices = () => {
            console.log("Callback: Checking waiting prices...");
            (Object.keys(coinPrices) as CoinSymbol[]).forEach((coin) => {
                const marketPrice = coinPrices[coin];
                const waitingPrice = waitingPrices[coin];

                if (marketPrice && waitingPrice) {
                    const [lowStr, highStr] = waitingPrice.split('-').map(s => s.trim());
                    const low = parseFloat(lowStr);
                    const high = parseFloat(highStr);

                    if (!isNaN(low) && !isNaN(high) && marketPrice >= low && marketPrice <= high) {
                        console.log(`${coin} is within range. Market: ${marketPrice}, Waiting: ${waitingPrice}`);
                        sendNotification(coin, marketPrice);
                    } else {
                         console.log(`${coin} is NOT within range. Market: ${marketPrice}, Waiting: ${waitingPrice}`);
                    }
                }
            });
        };
        
        if (Object.values(coinPrices).some(price => price !== null)) {
            const timeoutId = setTimeout(checkWaitingPrices, 2000); 
            return () => clearTimeout(timeoutId);
        }
    }, [coinPrices, waitingPrices, isClientMobile]);

    const toggleSection = (section: ActiveSection) => {
        setActiveSection(prevSection => prevSection === section ? null : section);
    };

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'notes':
                return (
                    <>
                        <h2 className="text-[#101518] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Epic Notes</h2>
                        <div className="flex flex-col gap-0">
                            {tasks.length === 0 && <p className="text-[#5c748a] text-center py-4">No tasks yet. Add one below!</p>}
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-center gap-4 bg-gray-50 px-4 min-h-[72px] py-3 border-b border-[#eaedf1]"
                                >
                                    <div className="text-[#101518] flex items-center justify-center rounded-lg bg-[#eaedf1] shrink-0 size-12">
                                        <NoteIcon />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center">
                                        <p className={cn("text-[#101518] text-base font-medium leading-normal", task.completed && "line-through text-[#5c748a]")}>
                                            {task.description}
                                        </p>
                                    </div>
                                     <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label={task.completed ? "Mark task as incomplete" : "Mark task as complete"}
                                        className="rounded-full h-8 w-8 hover:bg-gray-200 data-[completed=true]:bg-gray-300"
                                        data-completed={task.completed}
                                        onClick={() => handleCompleteTask(task.id)}
                                    >
                                        {task.completed ? (
                                            <Check className="h-5 w-5 text-green-600"/>
                                        ) : (
                                            <Circle className="h-5 w-5 text-[#5c748a]"/>
                                        )}
                                    </Button>
                                    <Button variant="ghost" size="icon" aria-label="Delete task" className="h-8 w-8 hover:bg-gray-200 rounded-full text-[#5c748a] hover:text-red-500"
                                                onClick={() => handleDeleteTask(task.id)}>
                                            <Trash className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                         <div className="flex items-center mt-4 px-4 py-3">
                            <Input
                                ref={inputRef}
                                type="text"
                                placeholder="Add a new epic note..."
                                value={newTaskDescription}
                                onChange={(e) => setNewTaskDescription(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#101518] focus:outline-0 focus:ring-0 border border-[#d4dce2] bg-[#eaedf1] focus:border-[#5c748a] h-12 placeholder:text-[#5c748a] px-4 text-base font-normal leading-normal"
                            />
                            <Button onClick={handleAddTask} className="ml-2 rounded-xl h-12 bg-[#5c748a] text-white hover:bg-[#4a5e70]">Add Note</Button>
                        </div>
                    </>
                );
            case 'lots':
                return (
                    <div className="p-4 space-y-6">
                        
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="md:w-1/2 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-[#5c748a] mb-1">Account Currency</label>
                                    <Input value="USD ($)" disabled className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" />
                                </div>
                                <div>
                                    <label htmlFor="lotsAccountBalance" className="block text-sm font-medium text-[#5c748a] mb-1">Account Balance</label>
                                    <Input type="number" id="lotsAccountBalance" value={lotsAccountBalance} onChange={(e) => setLotsAccountBalance(e.target.value)} className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" />
                                </div>
                                <div>
                                    <label htmlFor="lotsRiskPct" className="block text-sm font-medium text-[#5c748a] mb-1">Risk Percentage (%)</label>
                                    <Input type="number" id="lotsRiskPct" value={lotsRiskPct} onChange={(e) => setLotsRiskPct(e.target.value)} className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" />
                                </div>
                                <div>
                                    <label htmlFor="lotsPair" className="block text-sm font-medium text-[#5c748a] mb-1">Currency Pair</label>
                                    <Select value={lotsPair} onValueChange={handlePairChange}>
                                        <SelectTrigger className="w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]">
                                            <SelectValue placeholder="Select a pair" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectItem value="EURUSD">EUR/USD</SelectItem>
                                                <SelectItem value="GBPUSD">GBP/USD</SelectItem>
                                                <SelectItem value="USDJPY">USD/JPY</SelectItem>
                                                <SelectItem value="USDCAD">USD/CAD</SelectItem>
                                                <SelectItem value="USDCHF">USD/CHF</SelectItem>
                                                <SelectItem value="AUDUSD">AUD/USD</SelectItem>
                                                <SelectItem value="NZDUSD">NZD/USD</SelectItem>
                                            </SelectGroup>
                                            <SelectGroup>
                                                <SelectItem value="EURGBP">EUR/GBP</SelectItem>
                                                <SelectItem value="EURCHF">EUR/CHF</SelectItem>
                                                <SelectItem value="EURCAD">EUR/CAD</SelectItem>
                                                <SelectItem value="EURAUD">EUR/AUD</SelectItem>
                                                <SelectItem value="EURNZD">EUR/NZD</SelectItem>
                                                <SelectItem value="EURJPY">EUR/JPY</SelectItem>
                                                <SelectItem value="GBPCHF">GBP/CHF</SelectItem>
                                                <SelectItem value="GBPCAD">GBP/CAD</SelectItem>
                                                <SelectItem value="GBPAUD">GBP/AUD</SelectItem>
                                                <SelectItem value="GBPNZD">GBP/NZD</SelectItem>
                                                <SelectItem value="GBPJPY">GBP/JPY</SelectItem>
                                                <SelectItem value="AUDCAD">AUD/CAD</SelectItem>
                                                <SelectItem value="AUDCHF">AUD/CHF</SelectItem>
                                                <SelectItem value="AUDNZD">AUD/NZD</SelectItem>
                                                <SelectItem value="AUDJPY">AUD/JPY</SelectItem>
                                                <SelectItem value="CADCHF">CAD/CHF</SelectItem>
                                                <SelectItem value="CADJPY">CAD/JPY</SelectItem>
                                                <SelectItem value="NZDJPY">NZD/JPY</SelectItem>
                                                <SelectItem value="CHFJPY">CHF/JPY</SelectItem>
                                            </SelectGroup>
                                             <SelectGroup>
                                                <SelectItem value="USDSGD">USD/SGD</SelectItem>
                                            </SelectGroup>
                                             <SelectGroup>
                                                <SelectItem value="XAUUSD">XAU/USD (Gold)</SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label htmlFor="lotsEntryPrice" className="block text-sm font-medium text-[#5c748a] mb-1">Entry Price</label>
                                    <Input type="number" id="lotsEntryPrice" value={lotsEntryPrice} onChange={(e) => setLotsEntryPrice(e.target.value)}  className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" />
                                </div>
                                {calculationMode === 'Cross' && (
                                    <div>
                                        <label htmlFor="lotsConversionPrice" className="block text-sm font-medium text-[#5c748a] mb-1">Exchange Rate ({conversionPair})</label>
                                        <Input 
                                            type="text" 
                                            id="lotsConversionPrice" 
                                            value={isFetchingConversion ? "Fetching..." : lotsConversionPrice} 
                                            disabled 
                                            className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" 
                                        />
                                        {conversionError && <p className="text-red-500 text-xs mt-1">{conversionError}</p>}
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="lotsSlPrice" className="block text-sm font-medium text-[#5c748a] mb-1">Stop Loss Price</label>
                                    <Input type="number" id="lotsSlPrice" value={lotsSlPrice} onChange={(e) => setLotsSlPrice(e.target.value)}  className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" />
                                </div>
                                <div>
                                    <label htmlFor="lotsTpPrice" className="block text-sm font-medium text-[#5c748a] mb-1">Take Profit Price</label>
                                    <Input type="number" id="lotsTpPrice" value={lotsTpPrice} onChange={(e) => setLotsTpPrice(e.target.value)}  className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" />
                                </div>
                            </div>
                            <div className="md:w-1/2 flex items-start">
                                <div className="w-full space-y-2 p-4 bg-[#eaedf1] rounded-xl">
                                    <p className="text-lg font-semibold text-[#101518]">Result:</p>
                                    <div className="flex justify-between items-center pb-4 border-b border-gray-300">
                                        <span className="text-sm font-medium text-[#5c748a]">Standard Lot Size</span>
                                        <span className="text-3xl font-bold text-[#101518]">{lotsResult.standardLots.toFixed(4)}</span>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-[#5c748a]">Risk (Pips)</span>
                                            <span className="font-mono font-medium text-[#101518]">{Math.round(lotsResult.riskPips)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-[#5c748a]">Reward (Pips)</span>
                                            <span className="font-mono font-medium text-[#101518]">{Math.round(lotsResult.rewardPips)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-[#5c748a]">Risk/Reward Ratio</span>
                                            <span className="font-mono font-medium text-[#101518]">{lotsResult.rRatio.toFixed(2)} : 1</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm pt-2 mt-2 border-t border-gray-300">
                                            <span className="text-[#5c748a]">Risk Amount</span>
                                            <span className="font-mono font-medium text-[#101518]">${lotsResult.riskAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'crypto':
                return (
                    <div className="p-4 space-y-6">
                        <h2 className="text-[#101518] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3">Crypto Position Size Calculator</h2>
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="md:w-1/2 space-y-5">
                                <div>
                                    <label htmlFor="accountBalance" className="block text-sm font-medium text-[#5c748a] mb-1">Account Balance ($)</label>
                                    <Input type="number" id="accountBalance" placeholder="" value={accountBalance} onChange={(e) => setAccountBalance(e.target.value)} className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" />
                                </div>
                                <div>
                                    <label htmlFor="cryptoEntry" className="block text-sm font-medium text-[#5c748a] mb-1">Entry Price</label>
                                    <Input type="number" id="cryptoEntry" placeholder="" value={cryptoEntry} onChange={(e) => setCryptoEntry(e.target.value)} className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" />
                                </div>
                                <div>
                                    <label htmlFor="cryptoSL" className="block text-sm font-medium text-[#5c748a] mb-1">Stop Loss Price</label>
                                    <Input type="number" id="cryptoSL" placeholder="" value={cryptoSL} onChange={(e) => setCryptoSL(e.target.value)} className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" />
                                </div>
                                <div>
                                    <label htmlFor="cryptoTP" className="block text-sm font-medium text-[#5c748a] mb-1">Take Profit Price (Optional)</label>
                                    <Input type="number" id="cryptoTP" placeholder="" value={cryptoTP} onChange={(e) => setCryptoTP(e.target.value)} className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" />
                                </div>
                                <div>
                                    <label htmlFor="riskPercentage" className="block text-sm font-medium text-[#5c748a] mb-1">Risk Percentage (%)</label>
                                    <Input type="number" id="riskPercentage" placeholder="" value={riskPercentage} onChange={(e) => setRiskPercentage(e.target.value)} className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" />
                                </div>
                            </div>
                             <div className="md:w-1/2 flex items-start">
                                {(positionSize !== null || cryptoRiskRewardRatio !== null) && (
                                    <div className="w-full space-y-2 p-4 bg-[#eaedf1] rounded-xl">
                                        <p className="text-lg font-semibold text-[#101518]">Result:</p>
                                        {positionSize !== null && (
                                            <p className="text-[#101518]">Position Size (Units of Crypto): <span className="font-medium text-[#5c748a]">{positionSize.toFixed(4)}</span></p>
                                        )}
                                        {cryptoRiskRewardRatio !== null && (
                                            <p className="text-[#101518]">Risk/Reward Ratio: <span className="font-medium text-[#5c748a]">{cryptoRiskRewardRatio.toFixed(2)} : 1</span></p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'market':
                return (
                    <div className="p-4 space-y-6">
                        <div className="flex justify-between items-center pb-3">
                            <h2 className="text-[#101518] text-[22px] font-bold leading-tight tracking-[-0.015em]">Real-Time Market Prices</h2>
                            <Button
                                onClick={fetchMarketData}
                                variant="secondary"
                                size="sm"
                                disabled={loadingMarket}
                                className="rounded-full"
                            >
                                <RefreshCw className={cn("mr-2 h-4 w-4", loadingMarket && "animate-spin")} />
                                Refresh
                            </Button>
                        </div>
                        {loadingMarket && <p className="text-center text-[#5c748a]">Loading market data...</p>}
                        {errorMarket && <p className="text-center text-red-500">{errorMarket}</p>}
                        {!loadingMarket && !errorMarket && (
                             <div className="overflow-x-auto rounded-xl border border-[#d4dce2] bg-gray-50">
                                <table className="w-full table-fixed">
                                    <thead className="bg-[#eaedf1]">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[#101518] text-sm font-medium leading-normal w-1/3">Name</th>
                                            <th className="px-4 py-3 text-left text-[#101518] text-sm font-medium leading-normal w-1/3">Price</th>
                                            <th className="px-4 py-3 text-left text-[#101518] text-sm font-medium leading-normal w-1/3">Set Alert Range & Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(Object.keys(coinPrices) as CoinSymbol[]).map((coinSymbol) => (
                                            <tr key={coinSymbol} className="border-t border-[#d4dce2]">
                                                <td className="h-[72px] px-4 py-2 text-[#101518] text-sm font-normal leading-normal w-1/3">
                                                    {coinSymbol}
                                                </td>
                                                <td className="h-[72px] px-4 py-2 text-[#5c748a] text-sm font-normal leading-normal w-1/3">
                                                    {coinPrices[coinSymbol] !== null ? `$${coinPrices[coinSymbol]!.toFixed(2)}` : 'Loading...'}
                                                </td>
                                                <td className="h-[72px] px-4 py-2 text-sm font-normal leading-normal w-1/3">
                                                    <Input
                                                        type="text"
                                                        placeholder="e.g. 60000-65000"
                                                        className="form-input w-full rounded-xl bg-white border-[#d4dce2] h-10 px-3 text-[#101518] mb-1"
                                                        value={waitingPrices[coinSymbol] || ''}
                                                        onChange={(e) => setWaitingPrices(prev => ({...prev, [coinSymbol]: e.target.value}))}
                                                    />
                                                    {waitingPrices[coinSymbol] && coinPrices[coinSymbol] && getStatus(coinSymbol) && (
                                                        <p className="mt-1 text-xs text-[#101518]">Status: <span className={cn(
                                                            getStatus(coinSymbol) === 'Within' ? 'text-green-600' : 
                                                            getStatus(coinSymbol) === 'Above' || getStatus(coinSymbol) === 'Below' ? 'text-red-600' : 'text-[#5c748a]'
                                                        )}>{getStatus(coinSymbol)}</span></p>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="relative flex size-full min-h-screen flex-col bg-gray-50 group/design-root overflow-x-hidden">
          <div className="layout-container flex h-full grow flex-col">
            <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#eaedf1] px-10 py-3">
              <div className="flex items-center gap-4 text-[#101518]">
                <div className="size-7 text-[#5c748a]"> 
                  <FinanceHubLogoIcon />
                </div>
                <h2 className="text-[#101518] text-lg font-bold leading-tight tracking-[-0.015em]">Financial Hub</h2>
              </div>
              {fomcDateString && (
                  <span className="text-sm text-[#5c748a] whitespace-nowrap">{fomcDateString}</span>
              )}
            </header>
            <div className="px-1 sm:px-2 md:px-4 lg:px-8 flex flex-1 justify-center py-5">
              <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
                
                <h2 className="text-[#101518] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Quick Actions</h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 p-4">
                  <button onClick={() => toggleSection('notes')} className={cn("flex flex-1 gap-3 rounded-lg border p-4 items-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#5c748a]", activeSection === 'notes' ? "bg-[#d4dce2] border-[#5c748a]" : "bg-gray-50 border-[#d4dce2] hover:bg-[#eaedf1]")}>
                    <div className="text-[#101518]"><NoteIcon /></div>
                    <h2 className="text-[#101518] text-base font-bold leading-tight text-left">Epic Notes</h2>
                  </button>
                  <button onClick={() => toggleSection('lots')} className={cn("flex flex-1 gap-3 rounded-lg border p-4 items-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#5c748a]", activeSection === 'lots' ? "bg-[#d4dce2] border-[#5c748a]" : "bg-gray-50 border-[#d4dce2] hover:bg-[#eaedf1]")}>
                    <div className="text-[#101518]"><CurrencyCircleDollarIcon /></div>
                    <h2 className="text-[#101518] text-base font-bold leading-tight text-left">Lots Calculator</h2>
                  </button>
                  <button onClick={() => toggleSection('crypto')} className={cn("flex flex-1 gap-3 rounded-lg border p-4 items-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#5c748a]", activeSection === 'crypto' ? "bg-[#d4dce2] border-[#5c748a]" : "bg-gray-50 border-[#d4dce2] hover:bg-[#eaedf1]")}>
                    <div className="text-[#101518]"><CurrencyBtcIcon /></div>
                    <h2 className="text-[#101518] text-base font-bold leading-tight text-left">Crypto Calculator</h2>
                  </button>
                  <button onClick={() => toggleSection('market')} className={cn("flex flex-1 gap-3 rounded-lg border p-4 items-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#5c748a]", activeSection === 'market' ? "bg-[#d4dce2] border-[#5c748a]" : "bg-gray-50 border-[#d4dce2] hover:bg-[#eaedf1]")}>
                    <div className="text-[#101518]"><ChartLineIcon /></div>
                    <h2 className="text-[#101518] text-base font-bold leading-tight text-left">Market Pricing</h2>
                  </button>
                </div>
                
                <div className="mt-2">
                    {renderActiveSection()}
                </div>

              </div>
            </div>
          </div>
        </div>
    );
}

    

    

