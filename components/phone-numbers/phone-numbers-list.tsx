'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/assistants/config/livekit/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Phone, MapPin, Calendar, CheckCircle2, Clock, XCircle, Plus, Search, X, ArrowLeftRight, Copy, Info, Trash2 } from 'lucide-react';
import { PurchasePhoneNumberDialog } from './purchase-phone-number-dialog';
import { ConnectSipTrunkingDialog } from './connect-sip-trunking-dialog';
import { DeleteSipNumberDialog } from './delete-sip-number-dialog';

type PhoneNumber = {
  id: string;
  source?: 'livekit' | 'sip';
  e164_format: string;
  country_code: string;
  area_code: string;
  number_type: 'PHONE_NUMBER_TYPE_UNKNOWN' | 'PHONE_NUMBER_TYPE_MOBILE' | 'PHONE_NUMBER_TYPE_LOCAL' | 'PHONE_NUMBER_TYPE_TOLL_FREE';
  locality?: string;
  region?: string;
  capabilities?: string[];
  status: 'PHONE_NUMBER_STATUS_UNSPECIFIED' | 'PHONE_NUMBER_STATUS_ACTIVE' | 'PHONE_NUMBER_STATUS_PENDING' | 'PHONE_NUMBER_STATUS_RELEASED';
  assigned_at?: string;
  released_at?: string;
  sip_dispatch_rule_id?: string;
  webhook_url?: string;
  sip_endpoint?: string;
  provider?: 'twilio' | 'telnyx';
  nickname?: string;
};

type PhoneNumbersResponse = {
  items: PhoneNumber[];
  total_count: number;
};

function getStatusBadge(status: PhoneNumber['status']) {
  switch (status) {
    case 'PHONE_NUMBER_STATUS_ACTIVE':
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    case 'PHONE_NUMBER_STATUS_PENDING':
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case 'PHONE_NUMBER_STATUS_RELEASED':
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Released
        </Badge>
      );
    case 'PHONE_NUMBER_STATUS_UNSPECIFIED':
      return null;
    default:
      return null;
  }
}

function getNumberTypeLabel(type: PhoneNumber['number_type']) {
  switch (type) {
    case 'PHONE_NUMBER_TYPE_MOBILE':
      return 'Mobile';
    case 'PHONE_NUMBER_TYPE_LOCAL':
      return 'Local';
    case 'PHONE_NUMBER_TYPE_TOLL_FREE':
      return 'Toll-Free';
    case 'PHONE_NUMBER_TYPE_UNKNOWN':
      return 'Unknown';
    default:
      return 'Unknown';
  }
}

function getNumberTypeBadge(type: PhoneNumber['number_type']) {
  if (type === 'PHONE_NUMBER_TYPE_UNKNOWN') {
    return null;
  }

  return (
    <Badge variant="secondary" className="text-xs">
      {getNumberTypeLabel(type)}
    </Badge>
  );
}

export function PhoneNumbersList() {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [connectSipDialogOpen, setConnectSipDialogOpen] = useState(false);
  const [deleteSipDialogOpen, setDeleteSipDialogOpen] = useState(false);
  const [selectedSipNumber, setSelectedSipNumber] = useState<{ id: string; phoneNumber: string } | null>(null);



  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryCode, setCountryCode] = useState('US');
  const [areaCode, setAreaCode] = useState('');

  const fetchPhoneNumbers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/phone-numbers');

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch phone numbers');
      }

      const data: PhoneNumbersResponse = await response.json();
      setPhoneNumbers(data.items || []);
    } catch (err) {
      console.error('Error fetching phone numbers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch phone numbers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhoneNumbers();
  }, []);

  const handlePurchaseSuccess = () => {


    fetchPhoneNumbers();
  };



  const filteredPhoneNumbers = useMemo(() => {
    let filtered = [...phoneNumbers];



    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((number) => {
        const matchesNumber = number.e164_format.toLowerCase().includes(query);
        const matchesLocality = number.locality?.toLowerCase().includes(query);
        const matchesRegion = number.region?.toLowerCase().includes(query);
        return matchesNumber || matchesLocality || matchesRegion;
      });
    }



    if (countryCode && countryCode !== 'ALL') {
      filtered = filtered.filter((number) => {
        // Don't filter out numbers with empty country_code (e.g., SIP numbers before extraction)
        if (!number.country_code) return true;
        return number.country_code.toLowerCase() === countryCode.toLowerCase();
      });
    }



    if (areaCode.trim()) {
      filtered = filtered.filter((number) =>
        number.area_code?.toLowerCase().includes(areaCode.toLowerCase())
      );
    }

    return filtered;
  }, [phoneNumbers, searchQuery, countryCode, areaCode]);

  const handleSearch = () => {




  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCountryCode('US');
    setAreaCode('');
  };

  const hasActiveFilters = searchQuery.trim() || (countryCode && countryCode !== 'US' && countryCode !== 'ALL') || areaCode.trim();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (phoneNumbers.length === 0) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>No Phone Numbers</CardTitle>
            <CardDescription>
              You don&apos;t have any phone numbers yet. Buy a new number or connect your existing number via SIP trunking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add number
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPurchaseDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buy New Number
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConnectSipDialogOpen(true)}>
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Connect to your number via SIP trunking
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardContent>
        </Card>
        <PurchasePhoneNumberDialog
          open={purchaseDialogOpen}
          onOpenChange={setPurchaseDialogOpen}
          onSuccess={handlePurchaseSuccess}
        />
        <ConnectSipTrunkingDialog
          open={connectSipDialogOpen}
          onOpenChange={setConnectSipDialogOpen}
          onSuccess={handlePurchaseSuccess}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Your Phone Numbers</h2>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? `${filteredPhoneNumbers.length} of ${phoneNumbers.length} phone number${filteredPhoneNumbers.length !== 1 ? 's' : ''} found`
                : `${phoneNumbers.length} phone number${phoneNumbers.length !== 1 ? 's' : ''} found`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showSearch ? "default" : "outline"}
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add number
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setPurchaseDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buy New Number
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConnectSipDialogOpen(true)}>
                  <ArrowLeftRight className="w-4 h-4 mr-2" />
                  Connect to your number via SIP trunking
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Search Options Panel */}
        {showSearch && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search number"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full sm:w-[120px]">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">US</SelectItem>
                      <SelectItem value="ALL">All Countries</SelectItem>
                      <SelectItem value="CA">CA</SelectItem>
                      <SelectItem value="GB">GB</SelectItem>
                      <SelectItem value="AU">AU</SelectItem>
                      <SelectItem value="DE">DE</SelectItem>
                      <SelectItem value="FR">FR</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="ES">ES</SelectItem>
                      <SelectItem value="NL">NL</SelectItem>
                      <SelectItem value="BE">BE</SelectItem>
                      <SelectItem value="CH">CH</SelectItem>
                      <SelectItem value="AT">AT</SelectItem>
                      <SelectItem value="SE">SE</SelectItem>
                      <SelectItem value="NO">NO</SelectItem>
                      <SelectItem value="DK">DK</SelectItem>
                      <SelectItem value="FI">FI</SelectItem>
                      <SelectItem value="PL">PL</SelectItem>
                      <SelectItem value="IE">IE</SelectItem>
                      <SelectItem value="PT">PT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-[140px]">
                  <Input
                    placeholder="Area code"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="w-full sm:w-auto"
                  disabled={!searchQuery.trim() && !areaCode.trim() && (countryCode === 'US' || countryCode === 'ALL')}
                >
                  Search
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearSearch}
                    className="w-full sm:w-auto"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {filteredPhoneNumbers.map((number) => (
            <Card key={number.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-mono">
                        {number.e164_format}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {number.number_type !== 'PHONE_NUMBER_TYPE_UNKNOWN'
                          ? `${getNumberTypeLabel(number.number_type)} • ${number.country_code}`
                          : number.country_code}
                        {number.area_code && ` • Area Code ${number.area_code}`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {number.source === 'sip' ? (
                      <Badge variant="secondary">SIP</Badge>
                    ) : (
                      <>
                        {number.source === 'livekit' && (
                          <Badge variant="outline" className="text-xs">LiveKit</Badge>
                        )}
                        {getNumberTypeBadge(number.number_type)}
                      </>
                    )}
                    {number.source === 'livekit' && getStatusBadge(number.status)}
                    {number.source === 'sip' && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {number.source === 'sip' && number.provider === 'telnyx' && number.sip_endpoint && (
                  <div className="mb-4 rounded-md border bg-muted/50 p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium mb-1">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      Telnyx setup
                    </div>
                    <p className="text-muted-foreground mb-2">
                      In Telnyx Portal (Voice → SIP Trunking), add FQDN <strong>{number.sip_endpoint}</strong> (port 5060) to your connection and assign this number to it. Inbound format: +E.164.
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-background px-2 py-1.5 text-xs">
                        {number.sip_endpoint}
                      </code>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => void navigator.clipboard.writeText(number.sip_endpoint!)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy FQDN</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-muted-foreground mt-2 text-xs">
                      <a href="https://docs.livekit.io/telephony/start/providers/telnyx/" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">LiveKit Telnyx docs</a>
                    </p>
                  </div>
                )}
                {number.source === 'sip' && (number.provider === 'twilio' || !number.provider) && number.webhook_url && (
                  <div className="mb-4 rounded-md border bg-muted/50 p-3 text-sm">
                    <div className="flex items-center gap-2 font-medium mb-1">
                      <Info className="w-4 h-4 text-muted-foreground" />
                      Setup
                    </div>
                    <p className="text-muted-foreground mb-2">
                      In Twilio Console, set this number&apos;s Voice webhook URL to:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-background px-2 py-1.5 text-xs">
                        {number.webhook_url}
                      </code>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => void navigator.clipboard.writeText(number.webhook_url!)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Copy URL</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {number.nickname && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Nickname: {number.nickname}</span>
                    </div>
                  )}
                  {(number.locality || number.region) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>
                        {number.locality && number.region
                          ? `${number.locality}, ${number.region}`
                          : number.locality || number.region}
                      </span>
                    </div>
                  )}
                  {number.capabilities && number.capabilities.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Capabilities:</span>
                      <div className="flex gap-1">
                        {number.capabilities.map((cap) => (
                          <Badge key={cap} variant="outline" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {number.assigned_at && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Assigned: {new Date(number.assigned_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {/*
                  Configure routing (dispatch rules) is temporarily disabled.
                  {number.sip_dispatch_rule_id && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Dispatch Rule ID:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {number.sip_dispatch_rule_id}
                      </code>
                    </div>
                  )}
                */}
                </div>
                <div className="mt-4 flex justify-end">
                  {number.source === 'sip' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedSipNumber({ id: number.id, phoneNumber: number.e164_format });
                        setDeleteSipDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove SIP Number
                    </Button>
                  )}
                  {/*
                  Configure routing (dispatch rules) is temporarily disabled.
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPhoneNumber(number.e164_format);
                      setDispatchRuleDialogOpen(true);
                    }}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure routing
                  </Button>
                */}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <PurchasePhoneNumberDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        onSuccess={handlePurchaseSuccess}
      />
      <ConnectSipTrunkingDialog
        open={connectSipDialogOpen}
        onOpenChange={setConnectSipDialogOpen}
        onSuccess={handlePurchaseSuccess}
      />
      <DeleteSipNumberDialog
        open={deleteSipDialogOpen}
        onOpenChange={(open) => {
          setDeleteSipDialogOpen(open);
          if (!open) {
            setSelectedSipNumber(null);
          }
        }}
        onSuccess={() => {
          fetchPhoneNumbers();
          setDeleteSipDialogOpen(false);
          setSelectedSipNumber(null);
        }}
        sipNumberId={selectedSipNumber?.id || null}
        phoneNumber={selectedSipNumber?.phoneNumber || null}
      />

      {/*
        Configure routing (dispatch rules) is temporarily disabled.
        {selectedPhoneNumber && (
          <DispatchRuleSelectorDialog
            open={dispatchRuleDialogOpen}
            onOpenChange={(open) => {
              setDispatchRuleDialogOpen(open);
              if (!open) {
                setSelectedPhoneNumber(null);
              }
            }}
            phoneNumber={selectedPhoneNumber}
            onComplete={() => {
              fetchPhoneNumbers();
              setDispatchRuleDialogOpen(false);
              setSelectedPhoneNumber(null);
            }}
          />
        )}
      */}
    </>
  );
}
