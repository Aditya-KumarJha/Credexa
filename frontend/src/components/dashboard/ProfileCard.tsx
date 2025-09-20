import { User, Mail, WalletCards } from "lucide-react";
import ProviderIcons from "./ProviderIcons";

export default function ProfileCard({ user }: { user: any }) {
  return (
    <div className="p-8 rounded-2xl shadow-lg mb-10 border">
      <h3 className="text-xl font-semibold mb-6">Your Profile</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center">
          <User className="h-6 w-6 mr-3 text-cyan-500" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Full Name</p>
            <p className="font-medium">
              {user?.fullName?.firstName} {user?.fullName?.lastName}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <Mail className="h-6 w-6 mr-3 text-cyan-500" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
            <p className="font-medium">{user?.email || "Not Provided"}</p>
          </div>
        </div>
        <div className="flex items-center">
          <ProviderIcons provider={user?.provider} />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Login Provider
            </p>
            <p className="font-medium capitalize">{user?.provider}</p>
          </div>
        </div>
        {user?.walletAddress && (
          <div className="flex items-center">
            <WalletCards className="h-6 w-6 mr-3 text-cyan-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Wallet Address
              </p>
              <p className="font-mono text-sm break-all">
                {user.walletAddress}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center">
          <User className="h-6 w-6 mr-3 text-cyan-500" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Joined On</p>
            <p className="font-medium">
              {new Date(user?.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
