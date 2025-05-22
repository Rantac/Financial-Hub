
'use client';

import {useState, useEffect, useRef} from 'react';
import { Button } from '@/components/ui/button';
import { Check, Circle, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";

// Import new icons
import FinanceHubLogoIcon from '@/components/icons/FinanceHubLogoIcon';
import CurrencyCircleDollarIcon from '@/components/icons/CurrencyCircleDollarIcon';
import CurrencyBtcIcon from '@/components/icons/CurrencyBtcIcon';
import ChartLineIcon from '@/components/icons/ChartLineIcon';
import NoteIcon from '@/components/icons/NoteIcon';

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

type ActiveSection = 'notes' | 'pips' | 'crypto' | 'market' | null;

export default function Home() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const {toast} = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const [fomcDateString, setFomcDateString] = useState('');
    const [activeSection, setActiveSection] = useState<ActiveSection>('notes');


    // Forex Calculator State
    const [stopLoss, setStopLoss] = useState('');
    const [entry, setEntry] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [decimalPlaces, setDecimalPlaces] = useState(5);
    const [pipsOfRisk, setPipsOfRisk] = useState<number | null>(null);
    const [pipsOfReward, setPipsOfReward] = useState<number | null>(null);
    const [riskRewardRatio, setRiskRewardRatio] = useState<number | null>(null);

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

    const calculatePips = () => {
        if (!stopLoss || !entry || !takeProfit) {
            setPipsOfRisk(null);
            setPipsOfReward(null);
            setRiskRewardRatio(null);
            return;
        }

        const stopLossValue = parseFloat(stopLoss);
        const entryValue = parseFloat(entry);
        const takeProfitValue = parseFloat(takeProfit);

        if (isNaN(stopLossValue) || isNaN(entryValue) || isNaN(takeProfitValue)) {
            setPipsOfRisk(null);
            setPipsOfReward(null);
            setRiskRewardRatio(null);
            return;
        }

        const risk = Math.abs(entryValue - stopLossValue) * Math.pow(10, decimalPlaces);
        const reward = Math.abs(takeProfitValue - entryValue) * Math.pow(10, decimalPlaces);
        const ratio = risk > 0 ? reward / risk : 0;

        setPipsOfRisk(risk);
        setPipsOfReward(reward);
        setRiskRewardRatio(ratio);
    };

    useEffect(() => {
        calculatePips();
    }, [stopLoss, entry, takeProfit, decimalPlaces]);

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
    }, [cryptoEntry, cryptoSL, cryptoTP, riskPercentage, accountBalance]);

    useEffect(() => {
        const fetchMarketData = async () => {
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
        };

        if (activeSection === 'market') {
          fetchMarketData();
          const intervalId = setInterval(fetchMarketData, 1200000); 
          return () => clearInterval(intervalId); 
        }
    }, [activeSection]);

    const sendNotification = (coin: string, price: number) => {
        const commonIcon = '/favicon.ico';
    
        console.log("Attempting to send notification...");
    
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                console.log("Notification permission granted.");
                if (isClientMobile) {
                    const mobileNotificationTitle = 'Finance Hub Alert!';
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
                    const desktopNotificationTitle = `Desktop Alert: ${coin} Price Target Reached!`; 
                    const desktopNotificationOptions = {
                        body: `Attention: ${coin} is now trading at $${price.toFixed(2)}, which is within your specified alert range. Consider reviewing your charts and positions.`,
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
            case 'pips':
                return (
                    <div className="p-4 space-y-6">
                        <h2 className="text-[#101518] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3">Pips Calculator</h2>
                        <div className="grid gap-5">
                            <div>
                                <label htmlFor="stopLoss" className="block text-sm font-medium text-[#5c748a] mb-1">Stop Loss</label>
                                <Input type="number" id="stopLoss" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" />
                            </div>
                            <div>
                                <label htmlFor="entry" className="block text-sm font-medium text-[#5c748a] mb-1">Entry</label>
                                <Input type="number" id="entry" value={entry} onChange={(e) => setEntry(e.target.value)}  className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" />
                            </div>
                            <div>
                                <label htmlFor="takeProfit" className="block text-sm font-medium text-[#5c748a] mb-1">Take Profit</label>
                                <Input type="number" id="takeProfit" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)}  className="form-input w-full rounded-xl bg-[#eaedf1] border-[#d4dce2] h-12 px-4 text-[#101518]" />
                            </div>
                            <div>
                                <label htmlFor="decimalPlaces" className="block text-sm font-medium text-[#5c748a] mb-1">Decimal Places</label>
                                <select id="decimalPlaces" value={decimalPlaces} onChange={(e) => setDecimalPlaces(parseInt(e.target.value))} className="form-select block w-full rounded-xl border-[#d4dce2] bg-[#eaedf1] h-12 px-4 text-[#101518] focus:ring-0 focus:border-[#5c748a]">
                                    <option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option><option value={5}>5</option>
                                </select>
                            </div>
                            {pipsOfRisk !== null && pipsOfReward !== null && riskRewardRatio !== null && (
                                <div className="space-y-2 mt-4 p-4 bg-[#eaedf1] rounded-xl">
                                    <p className="text-lg font-semibold text-[#101518]">Result:</p>
                                    <p className="text-[#101518]">Pips of Risk: <span className="font-medium text-[#5c748a]">{pipsOfRisk.toFixed(2)}</span></p>
                                    <p className="text-[#101518]">Pips of Reward: <span className="font-medium text-[#5c748a]">{pipsOfReward.toFixed(2)}</span></p>
                                    <p className="text-[#101518]">Risk/Reward Ratio: <span className="font-medium text-[#5c748a]">{riskRewardRatio.toFixed(2)} : 1</span></p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 'crypto':
                return (
                    <div className="p-4 space-y-6">
                        <h2 className="text-[#101518] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3">Crypto Position Size Calculator</h2>
                        <div className="grid gap-5">
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
                            {(positionSize !== null || cryptoRiskRewardRatio !== null) && (
                                <div className="space-y-2 mt-4 p-4 bg-[#eaedf1] rounded-xl">
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
                );
            case 'market':
                return (
                    <div className="p-4 space-y-6">
                        <h2 className="text-[#101518] text-[22px] font-bold leading-tight tracking-[-0.015em] pb-3">Real-Time Market Prices</h2>
                        {loadingMarket && <p className="text-center text-[#5c748a]">Loading market data...</p>}
                        {errorMarket && <p className="text-center text-red-500">{errorMarket}</p>}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(Object.keys(coinPrices) as CoinSymbol[]).map((coinSymbol) => (
                                <div key={coinSymbol} className="space-y-2 p-4 bg-[#eaedf1] rounded-xl">
                                    <p className="text-lg text-[#101518] font-semibold">{coinSymbol}: <span className="font-normal text-[#5c748a]">{coinPrices[coinSymbol] !== null ? `$${coinPrices[coinSymbol]!.toFixed(2)}` : 'Loading...'}</span></p>
                                    <Input
                                        type="text"
                                        placeholder=""
                                        className="form-input w-full rounded-xl bg-white border-[#d4dce2] h-10 px-3 text-[#101518]"
                                        value={waitingPrices[coinSymbol] || ''}
                                        onChange={(e) => setWaitingPrices(prev => ({...prev, [coinSymbol]: e.target.value}))}
                                    />
                                    {waitingPrices[coinSymbol] && coinPrices[coinSymbol] && getStatus(coinSymbol) && (
                                        <p className="mt-1 text-sm text-[#101518]">Status: <span className={cn(
                                            getStatus(coinSymbol) === 'Within' ? 'text-green-600' : 
                                            getStatus(coinSymbol) === 'Above' || getStatus(coinSymbol) === 'Below' ? 'text-red-600' : 'text-[#5c748a]'
                                        )}>{getStatus(coinSymbol)}</span></p>
                                    )}
                                </div>
                            ))}
                        </div>
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
                <h2 className="text-[#101518] text-lg font-bold leading-tight tracking-[-0.015em]">Finance Hub</h2>
              </div>
              {fomcDateString && (
                  <span className="text-sm text-[#5c748a] whitespace-nowrap">{fomcDateString}</span>
              )}
            </header>
            <div className="px-4 sm:px-6 md:px-10 lg:px-20 flex flex-1 justify-center py-5"> {/* Adjusted padding here */}
              <div className="layout-content-container flex flex-col max-w-[960px] flex-1 md:max-w-4xl lg:max-w-5xl">
                
                <h2 className="text-[#101518] text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-3 pt-5">Quick Actions</h2>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3 p-4">
                  <button onClick={() => toggleSection('notes')} className={cn("flex flex-1 gap-3 rounded-lg border p-4 items-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#5c748a]", activeSection === 'notes' ? "bg-[#d4dce2] border-[#5c748a]" : "bg-gray-50 border-[#d4dce2] hover:bg-[#eaedf1]")}>
                    <div className="text-[#101518]"><NoteIcon /></div>
                    <h2 className="text-[#101518] text-base font-bold leading-tight text-left">Epic Notes</h2>
                  </button>
                  <button onClick={() => toggleSection('pips')} className={cn("flex flex-1 gap-3 rounded-lg border p-4 items-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#5c748a]", activeSection === 'pips' ? "bg-[#d4dce2] border-[#5c748a]" : "bg-gray-50 border-[#d4dce2] hover:bg-[#eaedf1]")}>
                    <div className="text-[#101518]"><CurrencyCircleDollarIcon /></div>
                    <h2 className="text-[#101518] text-base font-bold leading-tight text-left">Pips Calculator</h2>
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

