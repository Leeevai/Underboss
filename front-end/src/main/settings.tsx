import React, { useState } from 'react';

export default function SearchPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={handleSearch}
                style={{
                    padding: '10px 15px',
                    fontSize: '16px',
                    width: '300px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                }}
            />
        </div>
    );
}