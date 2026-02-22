'use client';

import { useState } from 'react';
import { Alert } from './alert';
import { Card } from './card';

export function FeedbackForm() {
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        try {
            setStatus('pending');
            setError(null);
            const myForm = event.target;
            const formData = new FormData(myForm);
            const payload = {
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message')
            };
            const res = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setStatus('ok');
                myForm.reset();
            } else {
                setStatus('error');
                const data = await res.json().catch(() => ({}));
                setError(data.error || `${res.status} ${res.statusText}`);
            }
        } catch (e) {
            setStatus('error');
            setError(`${e}`);
        }
    };

    return (
        <div className="w-full md:max-w-md">
            <Card title="Send a Message">
                <form name="feedback" onSubmit={handleFormSubmit} className="flex flex-col gap-3 align-center">
                    <input name="name" type="text" placeholder="Name" required className="input" />
                    <input name="email" type="email" placeholder="Email (optional)" className="input" />
                    <input name="message" type="text" placeholder="Message" required className="input" />
                    <button className="btn" type="submit" disabled={status === 'pending'}>
                        {status === 'pending' ? 'Sending...' : 'Send Message'}
                    </button>
                    {status === 'ok' && <Alert type="success">Message sent successfully!</Alert>}
                    {status === 'error' && <Alert type="error">{error}</Alert>}
                </form>
            </Card>
        </div>
    );
}
