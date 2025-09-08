import "@/styles/globals.css";
import Header from "../componenets/Navbar.jsx";
import AnnouncementBar from "@/componenets/Announmentbar.jsx";
import Footer from "@/componenets/footer.jsx";
import WhatsappButton from "@/componenets/WhatsappButton.jsx";
export default function App({ Component, pageProps }) {
  return <>
  <AnnouncementBar/>
    <Header/>
  <Component {...pageProps} />;
  <WhatsappButton/>
  <Footer/>
   </>
}
