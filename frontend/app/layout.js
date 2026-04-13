import "./globals.css";
import { AuthProvider } from "@/features/auth/auth-context";

export const metadata = {
  title: "BlockNote",
  description: "Block-based document editor",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
