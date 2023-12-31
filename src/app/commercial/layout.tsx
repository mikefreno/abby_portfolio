import Footer from "../Footer";
import Navbar from "../Navbar";

export const metadata = {
  title: "Commercial Work | Abigail Weinick",
  description: "Commercial Work",
};

export default function NonRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      <Navbar />
      {children}
      <Footer />
    </section>
  );
}
