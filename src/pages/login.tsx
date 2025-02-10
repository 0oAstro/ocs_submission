/* eslint-disable @typescript-eslint/no-explicit-any */
import { GetServerSideProps } from "next";
import { MD5 } from "../utils/md5";
import { useRouter } from "next/router"; // <-- added import

interface LoginPageProps {
  error?: string;
  data?: any;
}

const UserDetailsTable = ({ data }: { data: any }) => {
  const users = Array.isArray(data) ? data : [data];

  if (!users.length) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        No user data available
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          User Details
        </h3>
      </div>
      <div className="border-t border-gray-200 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Password Hash
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user, idx) => (
              <tr
                key={idx}
                className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.userid}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === "admin"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-mono text-gray-500 truncate max-w-xs">
                  {user.password_hash || "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function LoginPage({ error, data }: LoginPageProps) {
  const router = useRouter();
  const handleLogout = () => {
    // Perform logout logic if needed, then redirect to login
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        {/* Logo/Brand section */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-pink-500 rounded-full mb-4"></div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your credentials to access your account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {data ? (
          <div className="space-y-6">
            <UserDetailsTable data={data} />
            <button
              onClick={handleLogout}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition duration-150 ease-in-out"
            >
              Fetch Again
            </button>
          </div>
        ) : (
          <form method="POST" action="/login" className="mt-8 space-y-6">
            <div className="rounded-md -space-y-px">
              <div className="mb-5">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="userId"
                  type="text"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your username"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-pink-500 focus:border-pink-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition duration-150 ease-in-out"
            >
              Sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<LoginPageProps> = async (
  context
) => {
  if (context.req.method === "POST") {
    const body = await new Promise<Record<string, string>>(
      (resolve, reject) => {
        let data = "";
        context.req.on("data", (chunk) => {
          data += chunk;
        });
        context.req.on("end", () => {
          try {
            const params = new URLSearchParams(data);
            const values: Record<string, string> = {};
            for (const [key, value] of params) {
              values[key] = value;
            }
            resolve(values);
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    const { userId, password } = body;
    if (!userId || !password) {
      return { props: { error: "Missing required fields" } };
    }
    try {
      const passwordHash = MD5(password);
      const { authenticate } = await import("../../server/authInternal");
      const resultData = await authenticate(userId, passwordHash);
      return { props: { data: resultData } };
    } catch (err) {
      return { props: { error: (err as Error).message } };
    }
  }
  return { props: {} };
};
