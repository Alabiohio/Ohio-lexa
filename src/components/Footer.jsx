// Footer component displays the site copyright notice.
import React, { useRef, useEffect } from 'react';

function Footer() {

    const yrRef = useRef(null);
    useEffect(() => {
        const yearText = yrRef.current;
        yearText.textContent = new Date().getFullYear();

    }, []);

    return (
        <footer className="footer">
            &copy; <span id="year" ref={yrRef}></span> Ohio Codespace. All Rights Reserved.
        </footer>
    )
}

export default Footer;