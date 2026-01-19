import React from 'react';


export default function Navbar() {
    return (
        <nav style={{ backgroundColor: '#c03e3e', padding: '10px' }}>
            <ul style={{ listStyleType: 'none', margin: 0, padding: 0, display: 'flex', justifyContent: 'space-around' }}>
                <li><a href="#home" style={{ color: 'white', textDecoration: 'none' }}>Home</a></li>
                <li><a href="#profile" style={{ color: 'white', textDecoration: 'none' }}>Profile</a></li>
                <li><a href="#settings" style={{ color: 'white', textDecoration: 'none' }}>Settings</a></li>
            </ul>
        </nav>
    );
}