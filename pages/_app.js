import "@/styles/globals.css";
import Header from "../componenets/Navbar.jsx";
import AnnouncementBar from "@/componenets/Announmentbar.jsx";
import Footer from "@/componenets/footer.jsx";
import WhatsappButton from "@/componenets/WhatsappButton.jsx";
import { useRouter } from "next/router.js";
import * as gtag from "../lib/gtag";
import { useEffect } from "react";

export default function App({ Component, pageProps }) {

  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url) => {
      gtag.pageview(url);
    };
    router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [router.events]);

  return <>
  <AnnouncementBar/>
    <Header/>
  <Component {...pageProps} />;
  <WhatsappButton/>
  <Footer/>
   </>
}
