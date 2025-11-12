/**
 * Slack Integration Service
 * Handles sending notifications to Slack channels
 */

export interface SlackOrderNotification {
    orderId: string;
    customerName: string;
    customerEmail: string;
    items: Array<{
        title: string;
        quantity: number;
        price: number;
    }>;
    subtotal: number;
    total: number;
    shippingFee?: number;
    address: string;
    city: string;
    state: string;
    zipCode: string;
}

/**
 * Send order notification to Slack
 */
export async function sendOrderNotificationToSlack(
    notification: SlackOrderNotification
): Promise<boolean> {
    try {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;

        if (!webhookUrl) {
            console.warn('⚠️ Slack webhook URL not configured. Skipping Slack notification.');
            return false;
        }

        // Format items list
        const itemsList = notification.items
            .map((item) => `• ${item.title} (x${item.quantity}) - ¥${item.price.toLocaleString()}`)
            .join('\n');

        // Create rich Slack message
        const message = {
            channel: 'ec-order-notification',
            username: 'Order Bot',
            icon_emoji: ':shopping_cart:',
            attachments: [
                {
                    color: '#36a64f', // Green
                    title: `🎉 New Order Received: ${notification.orderId}`,
                    fields: [
                        {
                            title: 'Customer',
                            value: `${notification.customerName}\n${notification.customerEmail}`,
                            short: true,
                        },
                        {
                            title: 'Order Total',
                            value: `¥${notification.total.toLocaleString()} JPY`,
                            short: true,
                        },
                        {
                            title: 'Items Ordered',
                            value: itemsList,
                            short: false,
                        },
                        {
                            title: 'Delivery Address',
                            value: `${notification.address}\n${notification.city}, ${notification.state} ${notification.zipCode}`,
                            short: false,
                        },
                        {
                            title: 'Pricing Breakdown',
                            value: [
                                `Subtotal: ¥${notification.subtotal.toLocaleString()}`,
                                notification.shippingFee ? `Shipping: ¥${notification.shippingFee.toLocaleString()}` : null,
                                `**Total: ¥${notification.total.toLocaleString()}**`,
                            ]
                                .filter(Boolean)
                                .join('\n'),
                            short: false,
                        },
                    ],
                    footer: 'Japan Haul Admin',
                    footer_icon: 'https://platform.slack-edge.com/img/default_application_icon.png',
                    ts: Math.floor(Date.now() / 1000),
                },
            ],
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Slack API error:', response.status, errorText);
            return false;
        }

        console.log('✅ Order notification sent to Slack successfully');
        return true;
    } catch (error) {
        console.error('❌ Error sending order notification to Slack:', error);
        return false;
    }
}

/**
 * Send a simple text message to Slack
 */
export async function sendSlackMessage(message: string, channel?: string): Promise<boolean> {
    try {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;

        if (!webhookUrl) {
            console.warn('⚠️ Slack webhook URL not configured. Skipping Slack notification.');
            return false;
        }

        const payload = {
            channel: channel || 'ec-order-notification',
            text: message,
            username: 'Japan Haul Bot',
            icon_emoji: ':package:',
        };

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error('❌ Slack API error:', response.status);
            return false;
        }

        console.log('✅ Message sent to Slack successfully');
        return true;
    } catch (error) {
        console.error('❌ Error sending message to Slack:', error);
        return false;
    }
}
