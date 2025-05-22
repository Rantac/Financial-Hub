
'use client';

import {useState, useEffect, useRef} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Check, Circle, Trash} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Input} from '@/components/ui/input';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import { useToast } from "@/hooks/use-toast";


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
  return monthMap[monthName.slice(0,3)]; // Use first 3 chars for robust matching
}


export default function Home() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const {toast} = useToast();
    const inputRef = useRef<HTMLInputElement>(null);
    const [fomcDateString, setFomcDateString] = useState('');


    // Forex Calculator State
    const [stopLoss, setStopLoss] = useState('');
    const [entry, setEntry] = useState('');
    const [takeProfit, setTakeProfit] = useState('');
    const [decimalPlaces, setDecimalPlaces] = useState(5); // Default to 5 decimal places
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
    // const [marketData, setMarketData] = useState<any>(null); // marketData is not used, can be removed.
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    type CoinSymbol = "BTC" | "ETH" | "BNB" | "SOL" | "TON" | "LTC" | "XRP" | "XLM" | "LINK";
    const initialCoinPrices: Record<CoinSymbol, number | null> = {
        BTC: null, ETH: null, BNB: null, SOL: null, TON: null, LTC: null, XRP: null, XLM: null, LINK: null,
    };
    const [coinPrices, setCoinPrices] = useState<Record<CoinSymbol, number | null>>(initialCoinPrices);
    const [waitingPrices, setWaitingPrices] = useState<Record<CoinSymbol, string | null>>(initialCoinPrices as Record<CoinSymbol, string | null>);

    const [isClientMobile, setIsClientMobile] = useState(false);

    useEffect(() => {
      setIsClientMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
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
    
        if (riskPct !== null && riskPct > 0) { // Ensure riskPct is positive
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
            setLoading(true);
            setError(null); // Reset error before new fetch
            try {
                const url = 'https://coinranking1.p.rapidapi.com/coins?referenceCurrencyUuid=yhjMzLPhuIDl&timePeriod=24h&tiers=1&orderBy=marketCap&orderDirection=desc&limit=50&offset=0';
                const options = {
                    method: 'GET',
                    headers: {
                        'x-rapidapi-key': 'f0ad4a4797msh17ff46665ba9c66p1e5399jsnd422cb1c94df', // This key should ideally be an environment variable
                        'x-rapidapi-host': 'coinranking1.p.rapidapi.com'
                    }
                };
                const response = await fetch(url, options);
                if (!response.ok) {
                    const errorMessage = `HTTP error! status: ${response.status}`;
                    setError(errorMessage);
                    console.error("Market Price Fetch Error:", errorMessage); 
                    throw new Error(errorMessage);
                }
                const result = await response.json();
                
                const coinsToFetch: CoinSymbol[] = ["BTC", "ETH", "BNB", "SOL", "TON", "LTC", "XRP", "XLM", "LINK"];
                const newCoinPrices: Record<CoinSymbol, number | null> = {...initialCoinPrices};
                let anErrorOccurred = false;

                coinsToFetch.forEach(symbol => {
                    const coinData = result.data.coins.find((c: any) => c.symbol === symbol);
                    if (coinData && coinData.price) { // Add check for coinData.price
                        newCoinPrices[symbol] = parseFloat(coinData.price);
                    } else {
                        console.error(`${symbol} price not found or invalid in API response.`);
                        anErrorOccurred = true;
                    }
                });
                setCoinPrices(newCoinPrices);

                if (anErrorOccurred) {
                    setError(prevError => {
                        const newErrorMessage = "Some coin prices not found or invalid.";
                        if (prevError && !prevError.includes(newErrorMessage)) return `${prevError}, ${newErrorMessage}`;
                        return newErrorMessage;
                    });
                }

            } catch (e: any) {
                setError(e.message);
                console.error("Market Price Fetch API Error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchMarketData();
        const intervalId = setInterval(fetchMarketData, 1200000); 

        return () => clearInterval(intervalId); 
    }, []);

    const sendNotification = (coin: string, price: number) => {
        const commonIcon = '/favicon.ico'; 
    
        console.log("Attempting to send notification...");
    
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
                console.log("Notification permission granted.");
                if (isClientMobile) {
                    const mobileNotificationTitle = 'Price Alert!';
                    const mobileNotificationOptions = {
                        body: `${coin} is within your waiting price range at $${price.toFixed(2)}`,
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
                } else { // Desktop logic
                    console.log("Desktop device detected. Using Notification API.");
                    const desktopNotificationTitle = `Desktop Alert: ${coin} Price Update!`; 
                    const desktopNotificationOptions = {
                        body: `Heads up! ${coin} is now $${price.toFixed(2)} and has entered your specified alert range.`,
                        icon: commonIcon, 
                        // requireInteraction: true, // Optional: makes notification sticky on some systems
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
        
        if (Object.values(coinPrices).some(price => price !== null)) { // Only run if prices are loaded
            const timeoutId = setTimeout(checkWaitingPrices, 2000); 
            return () => clearTimeout(timeoutId);
        }
    }, [coinPrices, waitingPrices, isClientMobile]);


    return (
        <main className="flex flex-col items-center justify-start min-h-screen p-4 md:p-10">
            <Card className="w-full max-w-md space-y-4 bg-card text-card-foreground rounded-xl shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-6 px-6">
                    <CardTitle className="text-2xl font-bold text-accent">PX</CardTitle>
                     {fomcDateString && (
                        <span className="text-sm text-muted-foreground whitespace-nowrap">{fomcDateString}</span>
                    )}
                </CardHeader>
                <CardContent className="p-0">
                    <Tabs defaultValue="Epic Notes" className="w-full">
                        <TabsList className="grid w-full grid-cols-4 bg-secondary"> {/* Removed border-b border-border as TabsList itself has bottom border in its definition */}
                            <TabsTrigger value="Epic Notes" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm">Epic Notes</TabsTrigger>
                            <TabsTrigger value="Pips" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm">Pips</TabsTrigger>
                            <TabsTrigger value="Crypto" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm">Crypto</TabsTrigger>
                            <TabsTrigger value="Market" className="data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none text-xs sm:text-sm">Market</TabsTrigger>
                        </TabsList>
                        <TabsContent value="Epic Notes" className="space-y-6 p-6">
                            <div className="divide-y divide-border">
                                {tasks.length === 0 && <p className="text-muted-foreground text-center py-4">No tasks yet. Add one below!</p>}
                                {tasks.map((task) => (
                                    <div
                                        key={task.id}
                                        className="flex items-center justify-between py-4 hover:bg-muted transition-colors px-2 -mx-2 rounded-md"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                aria-label={task.completed ? "Mark task as incomplete" : "Mark task as complete"}
                                                className="rounded-full h-8 w-8 hover:bg-accent/20 data-[completed=true]:bg-accent/10"
                                                data-completed={task.completed}
                                                onClick={() => handleCompleteTask(task.id)}
                                            >
                                                {task.completed ? (
                                                    <Check className="h-5 w-5 text-accent"/>
                                                ) : (
                                                    <Circle className="h-5 w-5 text-muted-foreground"/>
                                                )}
                                            </Button>
                                            <span
                                                className={cn(
                                                    'text-base text-foreground',
                                                    task.completed && 'line-through text-muted-foreground'
                                                )}
                                            >
                                        {task.description}
                                    </span>
                                        </div>
                                        <Button variant="ghost" size="icon" aria-label="Delete task" className="h-8 w-8 hover:bg-accent/20 rounded-full text-muted-foreground hover:text-accent"
                                                    onClick={() => handleDeleteTask(task.id)}>
                                                <Trash className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                             <div className="flex items-center mt-4">
                                <Input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Add a new task..."
                                    value={newTaskDescription}
                                    onChange={(e) => setNewTaskDescription(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="flex-grow bg-input text-foreground placeholder:text-muted-foreground rounded-lg border-border focus:ring-ring focus:border-ring shadow-sm"
                                />
                                <Button onClick={handleAddTask} className="ml-2 rounded-lg" variant="outline">Add</Button>
                            </div>
                        </TabsContent>
                        <TabsContent value="Pips" className="space-y-6 p-6">
                            <div className="grid gap-5">
                                <div className="space-y-2">
                                    <label htmlFor="stopLoss" className="block text-sm font-medium text-muted-foreground">Stop Loss</label>
                                    <Input
                                        type="number"
                                        id="stopLoss"
                                        className="bg-input text-foreground placeholder:text-muted-foreground rounded-lg border-border focus:ring-ring focus:border-ring shadow-sm"
                                        value={stopLoss}
                                        onChange={(e) => setStopLoss(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="entry" className="block text-sm font-medium text-muted-foreground">Entry</label>
                                    <Input
                                        type="number"
                                        id="entry"
                                        className="bg-input text-foreground placeholder:text-muted-foreground rounded-lg border-border focus:ring-ring focus:border-ring shadow-sm"
                                        value={entry}
                                        onChange={(e) => setEntry(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="takeProfit" className="block text-sm font-medium text-muted-foreground">Take Profit</label>
                                    <Input
                                        type="number"
                                        id="takeProfit"
                                        className="bg-input text-foreground placeholder:text-muted-foreground rounded-lg border-border focus:ring-ring focus:border-ring shadow-sm"
                                        value={takeProfit}
                                        onChange={(e) => setTakeProfit(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="decimalPlaces" className="block text-sm font-medium text-muted-foreground">Decimal Places</label>
                                    <select
                                        id="decimalPlaces"
                                        className="mt-1 block w-full rounded-lg border-border bg-input text-foreground shadow-sm focus:border-ring focus:ring-ring sm:text-sm p-2.5"
                                        value={decimalPlaces}
                                        onChange={(e) => setDecimalPlaces(parseInt(e.target.value))}
                                    >
                                        <option value={1}>1</option>
                                        <option value={2}>2</option>
                                        <option value={3}>3</option>
                                        <option value={4}>4</option>
                                        <option value={5}>5</option>
                                    </select>
                                </div>
                                {pipsOfRisk !== null && pipsOfReward !== null && riskRewardRatio !== null && (
                                    <div className="space-y-2 mt-4 p-4 bg-secondary rounded-lg shadow-sm">
                                        <p className="text-lg font-semibold text-accent">Result:</p>
                                        <p className="text-foreground">Pips of Risk: <span className="font-medium text-accent">{pipsOfRisk.toFixed(2)}</span></p>
                                        <p className="text-foreground">Pips of Reward: <span className="font-medium text-accent">{pipsOfReward.toFixed(2)}</span></p>
                                        <p className="text-foreground">Risk/Reward Ratio: <span className="font-medium text-accent">{riskRewardRatio.toFixed(2)} : 1</span></p>
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                        <TabsContent value="Crypto" className="space-y-6 p-6">
                            <div className="grid gap-5">
                                 <div className="space-y-2">
                                    <label htmlFor="accountBalance" className="block text-sm font-medium text-muted-foreground">Account Balance ($)</label>
                                    <Input
                                        type="number"
                                        id="accountBalance"
                                        placeholder="e.g., 1000"
                                        className="bg-input text-foreground placeholder:text-muted-foreground rounded-lg border-border focus:ring-ring focus:border-ring shadow-sm"
                                        value={accountBalance}
                                        onChange={(e) => setAccountBalance(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="cryptoEntry" className="block text-sm font-medium text-muted-foreground">Entry Price</label>
                                    <Input
                                        type="number"
                                        id="cryptoEntry"
                                        placeholder="e.g., 50000"
                                        className="bg-input text-foreground placeholder:text-muted-foreground rounded-lg border-border focus:ring-ring focus:border-ring shadow-sm"
                                        value={cryptoEntry}
                                        onChange={(e) => setCryptoEntry(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="cryptoSL" className="block text-sm font-medium text-muted-foreground">Stop Loss Price</label>
                                    <Input
                                        type="number"
                                        id="cryptoSL"
                                        placeholder="e.g., 49000"
                                       className="bg-input text-foreground placeholder:text-muted-foreground rounded-lg border-border focus:ring-ring focus:border-ring shadow-sm"
                                        value={cryptoSL}
                                        onChange={(e) => setCryptoSL(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="cryptoTP" className="block text-sm font-medium text-muted-foreground">Take Profit Price (Optional)</label>
                                    <Input
                                        type="number"
                                        id="cryptoTP"
                                        placeholder="e.g., 52000"
                                        className="bg-input text-foreground placeholder:text-muted-foreground rounded-lg border-border focus:ring-ring focus:border-ring shadow-sm"
                                        value={cryptoTP}
                                        onChange={(e) => setCryptoTP(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="riskPercentage" className="block text-sm font-medium text-muted-foreground">Risk Percentage (%)</label>
                                    <Input
                                        type="number"
                                        id="riskPercentage"
                                        placeholder="e.g., 1 or 2"
                                        className="bg-input text-foreground placeholder:text-muted-foreground rounded-lg border-border focus:ring-ring focus:border-ring shadow-sm"
                                        value={riskPercentage}
                                        onChange={(e) => setRiskPercentage(e.target.value)}
                                    />
                                </div>
                                {(positionSize !== null || cryptoRiskRewardRatio !== null) && (
                                    <div className="space-y-2 mt-4 p-4 bg-secondary rounded-lg shadow-sm">
                                        <p className="text-lg font-semibold text-accent">Result:</p>
                                        {positionSize !== null && (
                                            <p className="text-foreground">Position Size (Units of Crypto): <span className="font-medium text-accent">{positionSize.toFixed(4)}</span></p>
                                        )}
                                        {cryptoRiskRewardRatio !== null && (
                                            <p className="text-foreground">Risk/Reward Ratio: <span className="font-medium text-accent">{cryptoRiskRewardRatio.toFixed(2)} : 1</span></p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                        <TabsContent value="Market" className="space-y-6 p-6">
                            {loading && <p className="text-center text-muted-foreground">Loading market data...</p>}
                            {error && <p className="text-center text-destructive">{error}</p>}
                            <div className="grid grid-cols-1 gap-y-5">
                                {(Object.keys(coinPrices) as CoinSymbol[]).map((coinSymbol) => (
                                    <div key={coinSymbol} className="space-y-2 p-4 bg-secondary rounded-lg shadow-sm">
                                        <p className="text-lg text-foreground font-semibold">{coinSymbol}: <span className="font-normal text-accent">{coinPrices[coinSymbol] !== null ? `$${coinPrices[coinSymbol]!.toFixed(2)}` : 'Loading...'}</span></p>
                                        
                                        <Input
                                            type="text"
                                            placeholder="Set alert range (e.g., 20000-21000)"
                                            className="bg-input text-foreground placeholder:text-muted-foreground rounded-lg border-border focus:ring-ring focus:border-ring shadow-sm"
                                            value={waitingPrices[coinSymbol] || ''}
                                            onChange={(e) => setWaitingPrices(prev => ({...prev, [coinSymbol]: e.target.value}))}
                                        />
                                        {waitingPrices[coinSymbol] && coinPrices[coinSymbol] && getStatus(coinSymbol) && ( // Ensure getStatus returns non-null
                                            <p className="mt-2 text-sm text-foreground">Status: <span className={cn(
                                                getStatus(coinSymbol) === 'Within' ? 'text-green-500' : 
                                                getStatus(coinSymbol) === 'Above' || getStatus(coinSymbol) === 'Below' ? 'text-red-500' : 'text-muted-foreground'
                                            )}>{getStatus(coinSymbol)}</span></p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </main>
    );
}
