'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/assistants/config/livekit/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Phone, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Loader2, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// Configure routing (dispatch rules) is temporarily disabled.
// import { DispatchRuleSelectorDialog } from './dispatch-rule-selector-dialog';

type PhoneNumber = {
  id: string;
  e164_format: string;
  country_code: string;
  area_code: string;
  number_type: 'PHONE_NUMBER_TYPE_UNKNOWN' | 'PHONE_NUMBER_TYPE_MOBILE' | 'PHONE_NUMBER_TYPE_LOCAL' | 'PHONE_NUMBER_TYPE_TOLL_FREE';
  locality?: string;
  region?: string;
  capabilities?: string[];
  status: 'PHONE_NUMBER_STATUS_UNSPECIFIED' | 'PHONE_NUMBER_STATUS_ACTIVE' | 'PHONE_NUMBER_STATUS_PENDING' | 'PHONE_NUMBER_STATUS_RELEASED';
  monthly_rate?: number; 

};

type SearchPhoneNumbersResponse = {
  items: PhoneNumber[];
  total_count?: number;
  page?: number;
  page_size?: number;
  total_pages?: number;
};

type PurchasePhoneNumberResponse = {
  phone_numbers: PhoneNumber[];
};

type SortField = 'number' | 'location' | 'type' | 'area_code' | 'monthly_rate' | null;
type SortDirection = 'asc' | 'desc' | null;

type PurchasePhoneNumberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

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

export function PurchasePhoneNumberDialog({
  open,
  onOpenChange,
  onSuccess,
}: PurchasePhoneNumberDialogProps) {
  

  const countryCode = 'US';
  const [areaCode, setAreaCode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PhoneNumber[]>([]);
  const [searching, setSearching] = useState(false);
  const [purchasing, setPurchasing] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Configure routing (dispatch rules) is temporarily disabled.
  // const [purchasedNumber, setPurchasedNumber] = useState<string | null>(null);
  // const [dispatchRuleDialogOpen, setDispatchRuleDialogOpen] = useState(false);
  
  

  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  
  

  const [showSearchExpanded, setShowSearchExpanded] = useState(false);

  const loadNumbers = useCallback(async (filterAreaCode: string = '') => {
    setSearching(true);
    setError(null);
    setCurrentPage(1);
    setSortField(null);
    setSortDirection(null);

    try {
      const response = await fetch('/api/phone-numbers/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          country_code: countryCode,
          area_code: filterAreaCode.trim() || undefined,
          limit: 100, 

        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to search phone numbers');
      }

      const data: SearchPhoneNumbersResponse = await response.json();
      const items = data.items || [];
      
      

      const itemsWithRate = items.map(item => ({
        ...item,
        monthly_rate: item.monthly_rate ?? 1.00,
      }));
      
      setSearchResults(itemsWithRate);
      
      

      const pages = Math.ceil(itemsWithRate.length / itemsPerPage);
      setTotalPages(pages || 1);
      
      if (itemsWithRate.length === 0) {
        setError('No phone numbers found. Try a different area code.');
      }
    } catch (err) {
      console.error('Error searching phone numbers:', err);
      setError(err instanceof Error ? err.message : 'Failed to search phone numbers');
    } finally {
      setSearching(false);
    }
  }, [countryCode, itemsPerPage]);

  

  useEffect(() => {
    if (open) {
      

      setAreaCode('');
      loadNumbers('');
    }
  }, [open, loadNumbers]);

  const handleClearAreaCode = () => {
    setAreaCode('');
    loadNumbers('');
  };

  const handleSearch = async () => {
    await loadNumbers(areaCode);
  };

  

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      handleClose();
    } else {
      onOpenChange(isOpen);
    }
  };

  const handlePurchase = async (e164Format: string) => {
    if (purchasing.has(e164Format)) {
      return; 

    }

    const newPurchasing = new Set(purchasing);
    newPurchasing.add(e164Format);
    setPurchasing(newPurchasing);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/phone-numbers/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_numbers: [e164Format],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to purchase phone number');
      }

      const data: PurchasePhoneNumberResponse = await response.json();
      const purchasedPhoneNumber = data.phone_numbers[0]?.e164_format || e164Format;
      setSuccess(`Successfully purchased ${purchasedPhoneNumber}!`);
      
      
      
      setSearchResults(prev => prev.filter(item => item.e164_format !== e164Format));
      
      // Configure routing (dispatch rules) is temporarily disabled.
      // setPurchasedNumber(purchasedPhoneNumber);
      // setDispatchRuleDialogOpen(true);
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
          setSuccess(null);
        }, 1500);
      } else {
        setTimeout(() => {
          setSuccess(null);
        }, 1500);
      }
    } catch (err) {
      console.error('Error purchasing phone number:', err);
      setError(err instanceof Error ? err.message : 'Failed to purchase phone number');
    } finally {
      const newPurchasing = new Set(purchasing);
      newPurchasing.delete(e164Format);
      setPurchasing(newPurchasing);
    }
  };

  const handleClose = () => {
    if (purchasing.size === 0) {
      setSearchResults([]);
      setError(null);
      setSuccess(null);
      setSearchQuery('');
      setAreaCode('');
      setCurrentPage(1);
      setSortField(null);
      setSortDirection(null);
      setShowSearchExpanded(false);
      // Configure routing (dispatch rules) is temporarily disabled.
      // setPurchasedNumber(null);
      // setDispatchRuleDialogOpen(false);
      onOpenChange(false);
    }
  };

  // Configure routing (dispatch rules) is temporarily disabled.
  // const handleDispatchRuleComplete = () => {
  //   setDispatchRuleDialogOpen(false);
  //   setPurchasedNumber(null);
  //   if (onSuccess) {
  //     onSuccess();
  //   }
  // };

  

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      

      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  

  const sortedAndFilteredResults = useMemo(() => {
    let results = [...searchResults];

    

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item => 
        item.e164_format.toLowerCase().includes(query) ||
        item.locality?.toLowerCase().includes(query) ||
        item.region?.toLowerCase().includes(query) ||
        item.area_code?.toLowerCase().includes(query) ||
        getNumberTypeLabel(item.number_type).toLowerCase().includes(query)
      );
    }

    

    if (sortField && sortDirection) {
      results.sort((a, b) => {
        let aVal: any;
        let bVal: any;

        switch (sortField) {
          case 'number':
            aVal = a.e164_format;
            bVal = b.e164_format;
            break;
          case 'location':
            aVal = `${a.locality || ''} ${a.region || ''}`.trim();
            bVal = `${b.locality || ''} ${b.region || ''}`.trim();
            break;
          case 'type':
            aVal = getNumberTypeLabel(a.number_type);
            bVal = getNumberTypeLabel(b.number_type);
            break;
          case 'area_code':
            aVal = a.area_code || '';
            bVal = b.area_code || '';
            break;
          case 'monthly_rate':
            aVal = a.monthly_rate ?? 0;
            bVal = b.monthly_rate ?? 0;
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return results;
  }, [searchResults, searchQuery, sortField, sortDirection]);

  

  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedAndFilteredResults.slice(start, end);
  }, [sortedAndFilteredResults, currentPage]);

  

  const filteredTotalPages = Math.ceil(sortedAndFilteredResults.length / itemsPerPage);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3 h-3 ml-1" />;
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="w-3 h-3 ml-1" />;
    }
    return <ArrowUpDown className="w-3 h-3 ml-1" />;
  };

  const formatPhoneNumber = (e164: string) => {
    

    const cleaned = e164.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+1') && cleaned.length === 12) {
      const area = cleaned.slice(2, 5);
      const exchange = cleaned.slice(5, 8);
      const number = cleaned.slice(8, 12);
      return `+1 ${area} ${exchange} ${number}`;
    }
    return e164;
  };

  const formatLocation = (locality?: string, region?: string) => {
    if (locality && region) {
      return `${locality.toUpperCase()}, ${region}`;
    }
    if (locality) return locality.toUpperCase();
    if (region) return region.toUpperCase();
    return '-';
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {}
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold mb-2">Buy a number</h2>
              <p className="text-sm text-muted-foreground mb-1">
                Purchase a phone number to use for inbound calls.
              </p>
              <p className="text-sm text-muted-foreground">
                Currently limited to United States numbers only.
              </p>
            </div>
          </div>
        </div>

        {}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold">Phone numbers</h3>
            <div className="flex items-center gap-4 flex-1 max-w-md justify-end">
              {!showSearchExpanded ? (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSearchExpanded(true)}
                  className="flex items-center justify-center"
                >
                  <Search className="h-4 w-4" />
                </Button>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Area code (e.g., 240)"
                      value={areaCode}
                      onChange={(e) => setAreaCode(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      className="w-32"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                    />
                    {areaCode && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleClearAreaCode}
                        disabled={searching}
                        title="Clear area code filter"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => handleSort('area_code')}
                  >
                    Area code
                    {getSortIcon('area_code')}
                  </Button>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowSearchExpanded(false)}
                    className="flex items-center justify-center"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {}
        {error && (
          <div className="px-6 py-2">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {success && (
          <div className="px-6 py-2">
            <Alert variant="default" className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
            </Alert>
          </div>
        )}

        {}
        <div className="flex-1 overflow-auto px-6">
          {searching && (
            <div className="space-y-2 py-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {!searching && paginatedResults.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('number')}
                  >
                    <div className="flex items-center">
                      NUMBER
                      {getSortIcon('number')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center">
                      LOCATION
                      {getSortIcon('location')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center">
                      TYPE
                      {getSortIcon('type')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('area_code')}
                  >
                    <div className="flex items-center">
                      Area code
                      {getSortIcon('area_code')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('monthly_rate')}
                  >
                    <div className="flex items-center">
                      MONTHLY RATE
                      {getSortIcon('monthly_rate')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedResults.map((number) => {
                  const isPurchasing = purchasing.has(number.e164_format);
                  return (
                    <TableRow key={number.e164_format}>
                      <TableCell className="font-mono">
                        {formatPhoneNumber(number.e164_format)}
                      </TableCell>
                      <TableCell>
                        {formatLocation(number.locality, number.region)}
                      </TableCell>
                      <TableCell>
                        {getNumberTypeLabel(number.number_type)}
                      </TableCell>
                      <TableCell>
                        {number.area_code || '-'}
                      </TableCell>
                      <TableCell>
                        ${number.monthly_rate?.toFixed(2) || '1.00'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePurchase(number.e164_format)}
                          disabled={isPurchasing}
                        >
                          {isPurchasing ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Buying...
                            </>
                          ) : (
                            'Buy'
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {!searching && searchResults.length === 0 && !error && (
            <div className="py-12 text-center text-muted-foreground">
              <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No phone numbers found. Try a different area code.</p>
            </div>
          )}

          {!searching && searchResults.length > 0 && paginatedResults.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <p>No results match your search query.</p>
            </div>
          )}
        </div>

        {}
        {!searching && sortedAndFilteredResults.length > 0 && (
          <div className="px-6 py-4 border-t flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Page {currentPage} of {filteredTotalPages || 1}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(prev => Math.min(filteredTotalPages || 1, prev + 1))}
              disabled={currentPage >= filteredTotalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(filteredTotalPages || 1)}
              disabled={currentPage >= filteredTotalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
      
      {/*
        Configure routing (dispatch rules) is temporarily disabled.
        {purchasedNumber && (
          <DispatchRuleSelectorDialog
            open={dispatchRuleDialogOpen}
            onOpenChange={setDispatchRuleDialogOpen}
            phoneNumber={purchasedNumber}
            onComplete={handleDispatchRuleComplete}
          />
        )}
      */}
    </Dialog>
  );
}
