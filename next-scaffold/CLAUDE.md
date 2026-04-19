# London Cuts

## Mission
Build the core product shell for London Cuts.

Image-to-image and image-to-video generation are owned by another teammate.
This repo must provide the surrounding product experience:
- public story website
- story atlas
- creator studio
- upload / organize / edit flow
- mode switching
- postcard generation
- media provider adapter and integration shell

## MVP
A complete demo includes:
- Landing page
- Public project page
- Atlas page
- Stop / Chapter page
- Studio dashboard
- Upload memory set
- Organize stops
- Story editor
- Media outputs panel using mock provider
- Postcard page
- Publish page

## Boundaries
Do not implement actual image-to-image or image-to-video model calls.
Implement adapter interfaces and mock provider.
The teammate’s real provider should be swappable later.

## Design Priorities
- editorial
- cinematic
- premium
- London-specific
- image-first
- strong mode differences: Punk / Fashion / Cinema

## Engineering Priorities
1. complete happy path first
2. use seed data early
3. keep data model clean
4. isolate media generation behind provider abstraction
5. public demo must remain stable
6. avoid broad rewrites
