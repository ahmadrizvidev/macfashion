import "@/styles/globals.css";
import Header from "../componenets/Navbar.jsx";
import AnnouncementBar from "@/componenets/Announmentbar.jsx";
export default function App({ Component, pageProps }) {
  return <>
  <AnnouncementBar/>
    <Header/>
  <Component {...pageProps} />;
   </>
}
