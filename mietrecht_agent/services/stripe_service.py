import stripe
import os

class StripeService:
    def __init__(self, api_key):
        self.api_key = api_key
        stripe.api_key = api_key

    def create_checkout_session(self, amount, currency, success_url, cancel_url, metadata=None):
        """
        Erstellt eine Stripe Checkout Session für eine Beratung.
        amount: Betrag in EURO (wird in Cents umgerechnet)
        """
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card', 'sepa_debit', 'giropay'], # Wichtig für DE
                line_items=[{
                    'price_data': {
                        'currency': currency,
                        'product_data': {
                            'name': 'JurisMind Erstberatung (Mietrecht)',
                            'description': 'Rechtliche Analyse und Fachberatung durch einen Anwalt.',
                        },
                        'unit_amount': int(amount * 100), # Stripe erwartet Cents
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata or {}
            )
            return session.url
        except Exception as e:
            print(f"Stripe Error: {e}")
            raise e

    def verify_webhook(self, payload, sig_header, endpoint_secret):
        """
        Verifiziert den Webhook von Stripe.
        """
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
            return event
        except ValueError as e:
            # Invalid payload
            raise e
        except stripe.error.SignatureVerificationError as e:
            # Invalid signature
            raise e
