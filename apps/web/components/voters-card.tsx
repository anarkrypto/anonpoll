"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { X, Search, UserPlus, ArrowRight } from "lucide-react";
import { truncateWalletAddress } from "@/lib/utils";
import { cn } from "@/lib/cn";
import { PublicKey } from "o1js";

// Mock data for demonstration purposes
const mockUsers = [
  {
    nickname: "anarkrypto",
    wallet: "B62qisCaNyznz9VtEVStHKhzUsCCp9JaD1eTb8zUWKGdxfdhauoj8MU",
  },
  {
    nickname: "cryptoking",
    wallet: "B62qiVGZQdBJJrxnzhvqp7LKe6jDiFcpU3cF5xHoZof5Pz9qiL85KLx",
  },
  {
    nickname: "nftcollector",
    wallet: "B62qs2xPJgNhvBw7ubgppB4YSDf1dYyvLYD1ghCrhnkXabLSVAainWx",
  },
];

type User = {
  nickname: string;
  wallet: string;
};

export function VotersCard({
  onConfirm,
  ...props
}: React.ComponentPropsWithRef<typeof Card> & {
  onConfirm?: (users: User[]) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [matchingUsers, setMatchingUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  function isValidMinaAddress(address: string) {
    // Step 1: Check the length
    if (address.length !== 55) {
      return false;
    }

    // Step 2: Check the prefix
    if (!address.startsWith("B62")) {
      return false;
    }

    // Step 3: Decode PublicKey from Base58
    try {
      PublicKey.fromBase58(address);
    } catch {
      return false;
    }

    return true;
  }

  useEffect(() => {
    if (searchTerm) {
      const lowercaseTerm = searchTerm.toLowerCase();
      const matches = mockUsers.filter(
        (user) =>
          user.nickname.toLowerCase().includes(lowercaseTerm) ||
          user.wallet.toLowerCase().includes(lowercaseTerm),
      );
      setMatchingUsers(matches);
    } else {
      setMatchingUsers([]);
    }
  }, [searchTerm]);

  const addUser = (user: User) => {
    if (!selectedUsers.some((u) => u.wallet === user.wallet)) {
      setSelectedUsers([...selectedUsers, user]);
      setSearchTerm("");
      setMatchingUsers([]);
    }
  };

  const removeUser = (wallet: string) => {
    setSelectedUsers(selectedUsers.filter((user) => user.wallet !== wallet));
  };

  const handleSubmit = useCallback(() => {
    onConfirm?.(selectedUsers);
  }, [onConfirm, selectedUsers]);

  return (
    <Card
      {...props}
      className={cn("mx-auto w-full max-w-2xl", props.className)}
    >
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          Add Voters Accounts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by wallet address or nickname"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          </div>

          {matchingUsers.length > 0 && (
            <ul className="mt-2 divide-y rounded-md border">
              {matchingUsers.map((user) => (
                <li
                  key={user.wallet}
                  className="flex items-center justify-between p-2 hover:bg-gray-100"
                >
                  <div>
                    <p className="font-semibold">{user.nickname}</p>
                    <p className="text-sm text-gray-500">
                      {truncateWalletAddress(user.wallet)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addUser(user)}
                  >
                    <UserPlus className="h-5 w-5" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {selectedUsers.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-lg font-semibold">Selected Users</h3>
              <ul className="space-y-2">
                {selectedUsers.map((user) => (
                  <li
                    key={user.wallet}
                    className="flex items-center justify-between rounded-md bg-gray-100 p-2"
                  >
                    <div>
                      <p className="font-semibold">{user.nickname}</p>
                      <p className="text-sm text-gray-500">
                        {truncateWalletAddress(user.wallet)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUser(user.wallet)}
                    >
                      <X className="h-5 w-5 text-red-500" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isValidMinaAddress(searchTerm) && !matchingUsers.length && (
            <div className="mt-2 rounded-md bg-green-100 p-2">
              <p className="text-green-800">
                Valid Mina wallet detected. You can add this address.
              </p>
              <Button
                className="mt-2"
                onClick={() =>
                  addUser({
                    nickname: "Unknown",
                    wallet: searchTerm,
                  })
                }
              >
                Add Address
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      {selectedUsers.length > 0 && (
        <CardFooter>
          <Button type="submit" className="w-full" onClick={handleSubmit}>
            Create
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
