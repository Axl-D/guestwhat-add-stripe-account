# GuestWhat Stripe Account Integration

This project provides an API service to create and manage Stripe Connect accounts for non-profit organizations, with integration to a Bubble.io backend.

## Features

- Create Stripe Connect custom accounts for non-profit organizations
- Add person information and verification documents
- Link bank accounts for payouts
- Integrate with Bubble.io for additional organization data
- Support for both test and production environments

## Prerequisites

- Node.js (v14 or higher)
- Stripe API keys
- Bubble.io API credentials
- Environment variables (see Configuration section)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/Axl-D/guestwhat-add-stripe-account.git
cd guestwhat-add-stripe-account
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:

```
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
BUBBLE_API_TOKEN=your_bubble_api_token
BUBBLE_API_URL=your_bubble_api_url
```

## API Endpoints

### POST /submit-to-stripe

Creates a new Stripe Connect account for a non-profit organization.

Request body should include:

- Organization details (name, address, SIRET, etc.)
- Person details (director information, ID documents)
- Bank account information (IBAN)

### POST /submit-to-bubble/:accountId

Updates the Bubble.io database with the organization information and Stripe account ID.

Parameters:

- `accountId`: The Stripe account ID
- `isTest`: Query parameter to specify test/production environment

## Configuration

The application requires the following environment variables:

- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `BUBBLE_API_TOKEN`: Your Bubble.io API token
- `BUBBLE_API_URL`: Your Bubble.io API URL

## Development

To start the development server:

```bash
node app.js
```

The server will run on port 3000 by default.

## Error Handling

The application includes comprehensive error handling for:

- Invalid input data
- Stripe API errors
- Bubble.io API errors
- Document upload failures

## Security

- Environment variables are used for sensitive credentials
- Input validation is performed on all requests
- Error messages are sanitized before being sent to clients

## License

ISC
