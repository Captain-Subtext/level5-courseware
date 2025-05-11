import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import apiClient from '@/lib/apiClient';
import Navbar from '@/components/Navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from "@/components/ui/use-toast";
import {
  MoreHorizontal,
  Search,
  UserCog,
  ChevronLeft,
  Loader2,
  ArrowUpDown,
  ChevronsLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table"

// Define the user data structure expected from the API
interface UserData {
  id: string;
  email: string | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  marketing_preference: boolean;
  content_updates_preference: boolean;
  account_changes_preference: boolean;
  is_premium: boolean;
  is_manual_subscription: boolean;
}

// Type for the API response
interface UsersApiResponse {
  users: UserData[];
  total: number;
}

export default function AdminUsers() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  // Update state types
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0); // State for total count
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // Add error state
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return; // Exit early if not admin
    }
    fetchUsers();
  }, [navigate, isAdmin]);

  useEffect(() => {
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      // Update filter logic based on UserData fields
      const filtered = users.filter(
        (u) =>
          (u.email && u.email.toLowerCase().includes(lowerQuery)) ||
          (u.id && u.id.toLowerCase().includes(lowerQuery))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  // Function to fetch users using the API client
  async function fetchUsers() {
    setIsLoading(true);
    setError(null);
    try {
      // Call the new backend endpoint
      const response = await apiClient.get<UsersApiResponse>('/api/admin/users');
      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
      setTotalUsers(response.data.total); // Set total user count
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.error || 'Failed to fetch users. Ensure you are logged in as an admin.');
    } finally {
      setIsLoading(false);
    }
  }

  // Format date for display
  function formatDate(dateString: string | null | undefined) { // Allow undefined
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy, h:mm a');
    } catch (e) {
      return 'Invalid Date';
    }
  }

  // Handler for granting monthly subscription
  async function handleGrantMonthly(userId: string) {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await apiClient.post(`/api/admin/users/${userId}/grant-monthly`);
      toast({
        title: "Success",
        description: response.data.message || "Monthly subscription granted.",
      });

      // OPTIMISTIC UPDATE: Update local state immediately
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, is_premium: true, is_manual_subscription: true } // Assume manual grant sets both
            : user
        )
      );
      // Note: The fetchUsers() below will still run to ensure data consistency with the backend

      await fetchUsers(); // Refresh the user list
    } catch (err: any) {
      console.error('Error granting subscription:', err);
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to grant subscription.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  }

  // Handler for revoking monthly subscription
  async function handleRevokeMonthly(userId: string) {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const response = await apiClient.post(`/api/admin/users/${userId}/revoke-monthly`);
      toast({
        title: "Success",
        description: response.data.message || "Monthly subscription revoked.",
      });

      // OPTIMISTIC UPDATE: Update local state immediately
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId
            ? { ...user, is_premium: false, is_manual_subscription: false } // Revoking removes both flags
            : user
        )
      );
      // Note: The fetchUsers() below will still run

      await fetchUsers(); // Refresh the user list
    } catch (err: any) {
      console.error('Error revoking subscription:', err);
      toast({
        title: "Error",
        description: err.response?.data?.error || "Failed to revoke subscription.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  }

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Define table columns using useMemo
  const columns = useMemo<ColumnDef<UserData>[]>(() => [
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "id",
      header: "User ID",
      cell: ({ row }) => <div className="text-xs font-mono">{row.getValue('id')}</div>,
    },
    {
      accessorKey: "created_at",
      header: "Created At",
      cell: ({ row }) => {
        const date = row.getValue('created_at') ? new Date(row.getValue('created_at') as string) : null;
        return date ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ", " + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'N/A';
      },
    },
    {
      accessorKey: "last_sign_in_at",
      header: "Last Sign In",
      cell: ({ row }) => {
        const date = row.getValue('last_sign_in_at') ? new Date(row.getValue('last_sign_in_at') as string) : null;
        return date ? date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) + ", " + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'Never';
      },
    },
    // Marketing Preference Column (Read-only checkbox)
    {
      accessorKey: "marketing_preference",
      header: "Marketing?",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Checkbox
            checked={row.getValue('marketing_preference')}
            disabled // Make it clear this is read-only in the table
            aria-label="Marketing Preference"
          />
        </div>
      ),
    },
    // Content Updates Preference Column (Read-only checkbox) - Added
    {
      accessorKey: "content_updates_preference",
      header: "Content?", // Shortened header
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Checkbox
            checked={row.getValue('content_updates_preference')}
            disabled
            aria-label="Content Updates Preference"
          />
        </div>
      ),
    },
    // Account Changes Preference Column (Read-only checkbox) - Added
    {
      accessorKey: "account_changes_preference",
      header: "Account?", // Shortened header
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Checkbox
            checked={row.getValue('account_changes_preference')}
            disabled
            aria-label="Account Changes Preference"
          />
        </div>
      ),
    },
    // Subscription Status Column
    {
      accessorKey: "is_premium",
      header: "Subscription",
      cell: ({ row }) => {
        const isPremium = row.getValue('is_premium');
        const isManual = row.original.is_manual_subscription;
        return (
          <Badge variant={isPremium ? "default" : "secondary"}>
            {isPremium ? (isManual ? "Premium (Manual)" : "Premium") : "Free"}
          </Badge>
        );
      },
    },
    // Actions Column
    {
      id: "actions",
      cell: ({ row }) => {
        // ... actions logic remains the same ...
        const user = row.original;
        const isManual = user.is_manual_subscription;
        const canGrant = !user.is_premium; // Can grant only if not already premium
        const canRevoke = user.is_premium && isManual; // Can only revoke active manual subscriptions

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.email || '')}>
                Copy Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                Copy User ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canGrant && (
                 <DropdownMenuItem onClick={() => handleGrantMonthly(user.id)}>
                   Grant Monthly Subscription
                 </DropdownMenuItem>
              )}
              {canRevoke && (
                 <DropdownMenuItem 
                   onClick={() => handleRevokeMonthly(user.id)}
                   className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                 >
                   Revoke Monthly Subscription
                 </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [handleGrantMonthly, handleRevokeMonthly]); // Add dependencies
  
  // Initialize the table instance HERE, before the return statement
  const table = useReactTable({
    data: filteredUsers, // Use filteredUsers for rendering
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // Enable pagination
    manualPagination: false, // Let the table handle pagination
    manualFiltering: true, // Filtering is handled by useState/useEffect
    manualSorting: false, // Let the table handle sorting
    state: {
      sorting,
      columnFilters,
    },
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You do not have permission to access the admin user management.</p>
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="mt-4"
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <Button 
              variant="ghost" 
              className="mb-2 p-0" 
              onClick={() => navigate('/admin')}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Admin Dashboard
            </Button>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              View and manage user accounts
            </p>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <CardTitle className="flex items-center">
                  <UserCog className="h-5 w-5 text-primary mr-2" />
                  Users
                </CardTitle>
                <CardDescription>
                  {isLoading ? 'Loading users...' : `${table.getFilteredRowModel().rows.length} of ${totalUsers} users shown`}
                </CardDescription>
              </div>
              
              <div className="mt-4 md:mt-0 w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Filter emails or IDs..." 
                    className="pl-8 w-full md:w-[300px]" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="text-destructive">Error: {error}</p>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => {
                            return (
                              <TableHead key={header.id} style={{ textAlign: header.column.id.includes('preference') ? 'center' : 'left' }}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </TableHead>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && "selected"}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id} style={{ textAlign: cell.column.id.includes('preference') ? 'center' : 'left' }}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={columns.length} className="h-24 text-center">
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 py-4">
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => table.setPageIndex(0)}
                     disabled={!table.getCanPreviousPage()}
                   >
                     <ChevronsLeft className="h-4 w-4" />
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => table.previousPage()}
                     disabled={!table.getCanPreviousPage()}
                   >
                     <ChevronLeft className="h-4 w-4" />
                   </Button>
                   <span className="text-sm">
                      Page {table.getState().pagination.pageIndex + 1} of{" "}
                      {table.getPageCount()}
                   </span>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => table.nextPage()}
                     disabled={!table.getCanNextPage()}
                   >
                      <ChevronRight className="h-4 w-4" />
                   </Button>
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                     disabled={!table.getCanNextPage()}
                   >
                     <ChevronsRight className="h-4 w-4" />
                   </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 