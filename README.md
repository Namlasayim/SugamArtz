# Artisan Canvas

Build a premium, elegant e-commerce portfolio website for a Nepalese artist who sells original paintings.

IMPORTANT:

This is for ONE artist only, not a marketplace.

The website must have two separate experiences:

1. PUBLIC CUSTOMER WEBSITE

2. PRIVATE ARTIST ADMIN DASHBOARD

Use a modern, premium art-gallery aesthetic.

The artwork must be the visual focus.

Design should feel:

- sophisticated

- artistic

- minimal

- luxurious

- warm

- modern

- trustworthy

Do not make it look like a generic ecommerce template.

Make it fully responsive, especially for mobile because most customers will visit from phones.

PUBLIC WEBSITE:

Create these pages:

/

/gallery

/painting/:id

/custom

/about

/contact

/track-order

/wishlist

/order-confirmation

HOME PAGE:

Include:

- large hero artwork

- artist name

- short artist statement

- Explore Artwork button

- Custom Painting button

- featured paintings

- latest paintings

- sold works preview

- artist story

- Instagram section

- contact section

GALLERY:

Show paintings dynamically from the backend.

Each painting should support:

- title

- price

- images

- medium

- dimensions

- year

- category

- description

- artwork story

- availability

- featured status

- unique artwork ID

Add:

- search

- category filtering

- price filtering

- newest sorting

- price sorting

- available/sold filtering

PAINTING DETAIL PAGE:

Show:

- large image gallery

- image zoom

- title

- price

- medium

- dimensions

- year

- description

- artwork story

- availability

- artwork ID

- related artworks

If available:

Show "Order This Painting"

If sold:

Show "SOLD" and disable purchasing.

WISHLIST:

Allow customers to save paintings locally without requiring an account.

CUSTOM PAINTING PAGE:

Create a beautiful custom commission section.

Explain that customers can request a painting made specifically for them.

Include:

- name

- WhatsApp number

- email

- painting idea

- preferred size

- budget

- deadline

- optional reference image

Add two prominent buttons:

- Contact Artist on WhatsApp

- Contact Artist on Instagram

The artist's WhatsApp number and Instagram username must be configurable from the admin settings rather than hardcoded throughout the application.

ORDER FLOW:

For an available painting, allow the customer to click "Order This Painting".

Show a simple checkout/order form.

Collect:

- full name

- phone

- WhatsApp number

- email

- province

- district

- municipality

- full delivery address

- landmark

- delivery instructions

Show:

- painting

- price

- delivery fee

- total

There is NO automated online payment gateway in this version.

Instead, after the customer confirms the order:

1. Create an order in Supabase.

2. Generate a unique order ID.

3. Copy a formatted order message to the customer's clipboard.

4. Open the artist's WhatsApp chat.

5. Tell the customer to paste the copied message and send it.

The copied message should contain:

Hello! I would like to purchase this painting.

Order ID: [ORDER ID]

Painting: [PAINTING NAME]

Artwork ID: [ARTWORK ID]

Price: [PRICE]

Customer:

Name: [NAME]

Phone: [PHONE]

WhatsApp: [WHATSAPP]

Email: [EMAIL]

Delivery:

Province: [PROVINCE]

District: [DISTRICT]

Municipality: [MUNICIPALITY]

Address: [ADDRESS]

Landmark: [LANDMARK]

Instructions: [INSTRUCTIONS]

Please confirm the order and payment details.

Do NOT claim that payment has been completed.

After the order is created, show:

"Order request sent"

Explain:

"The artist will contact you on WhatsApp to confirm payment and delivery."

Add a fallback if clipboard access fails:

- display the complete order message

- provide a Copy button

- provide a WhatsApp button

Use a WhatsApp deep link to open the artist's chat.

ORDER TRACKING:

Create a simple tracking page.

Customer enters order ID.

Show:

- Order placed

- Payment pending/confirmed

- Preparing

- Shipped

- Delivered

Do not expose private customer information publicly.

ABOUT:

Create a premium artist biography page.

CONTACT:

Show:

- WhatsApp

- Instagram

- email

- location

- contact form

SOLD WORKS:

Keep sold paintings visible in a separate section/gallery.

Show SOLD clearly and prevent new purchases.

ADMIN:

Create a private /admin route.

Do not expose admin navigation publicly.

Admin will be implemented using Supabase authentication and role-based access.

Create the UI structure for:

- dashboard

- paintings

- orders

- custom requests

- notifications

- settings

Do not use mock data once Supabase is connected.

Use clean reusable components.

Prioritize accessibility, fast loading, image optimization, mobile responsiveness, SEO, and excellent visual design.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://painted-soul-gallery.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a52fbfba-2bdc-482f-9b29-f933bea147f5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

### First administrator

Create the artist's account in Supabase Auth, then grant it studio access from a
trusted environment. The service-role key must never be placed in the browser or
committed to the repository:

```sh
SUPABASE_URL="https://your-project.supabase.co" \\
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \\
npm run admin:bootstrap -- artist@example.com
```

This command is intentionally separate from public sign-up so a visitor cannot
claim the first administrator account. The dashboard checks the `user_roles`
table directly.

### Supabase deployment

Apply the migrations before using the order, commission or contact forms. The
latest migration is additive and provisions the `painting-images`, `artist-assets`
and `custom-request-images` buckets with a 15 MB image limit:

```sh
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Review the migration in `supabase/migrations/20260823120000_harden_gallery_and_repair_runtime.sql`
before applying it to an existing project. It preserves existing business
tables and historical rows; old sequential artwork/order codes cannot be made
non-enumerable retroactively, but all new codes use random UUID-derived suffixes.
Do not run the bootstrap command in a browser, CI log, or any environment where
the service-role key could be exposed.
