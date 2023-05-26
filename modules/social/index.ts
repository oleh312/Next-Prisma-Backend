import { Facebook, Instagram, Twitter } from '@prisma/client'
import pothos from '../../libs/pothos'
import prisma from '../../libs/prisma'
import { checkAuth, isUser } from '../../utils/auth'
import { getSocialProvider } from '../../utils/social'
import './facebook'
import './instagram'
import './twitter'

export const GQLSocialNameEnum = pothos.enumType('SocialNameEnum', {
  values: ['TWITTER', 'FACEBOOK', 'INSTAGRAM'] as const,
})

export const GQLTwitter = pothos.objectRef<Twitter>('Twitter')

GQLTwitter.implement({
  fields: (t) => ({
    id: t.exposeID('twitterId'),
    username: t.exposeString('twitterUsername'),
  }),
})

export const GQLFacebook = pothos.objectRef<Facebook>('Facebook')

GQLFacebook.implement({
  fields: (t) => ({
    id: t.exposeID('facebookId'),
    username: t.exposeString('facebookUsername'),
  }),
})

export const GQLInstagram = pothos.objectRef<Instagram>('Instagram')

GQLInstagram.implement({
  fields: (t) => ({
    id: t.exposeID('instagramId'),
    username: t.exposeString('instagramUsername'),
  }),
})

export const GQLSocial = pothos.unionType('Social', {
  types: [GQLTwitter, GQLFacebook, GQLInstagram],
  resolveType: (obj) => {
    if ('twitterId' in obj) return GQLTwitter
    if ('facebookId' in obj) return GQLFacebook
    if ('instagramId' in obj) return GQLInstagram
  },
})

pothos.mutationFields((t) => ({
  authWithSocial: t.string({
    args: {
      name: t.arg({ type: GQLSocialNameEnum }),
    },
    resolve: async (obj, { name }, { user }) => {
      await checkAuth(() => isUser(user))

      switch (name) {
        case 'TWITTER':
          return await getSocialProvider('twitter').getAuthorizationURL(user!.id)
        case 'FACEBOOK':
          return await getSocialProvider('facebook').getAuthorizationURL(user!.id)
        case 'INSTAGRAM':
          return await getSocialProvider('instagram').getAuthorizationURL(user!.id)
      }
    },
  }),
  removeSocial: t.boolean({
    args: {
      name: t.arg({ type: GQLSocialNameEnum }),
    },
    resolve: async (obj, { name }, { user }) => {
      await checkAuth(() => isUser(user))

      switch (name) {
        case 'TWITTER':
          await prisma.twitter.deleteMany({ where: { user: { id: user!.id } } })
          return true
        case 'FACEBOOK':
          await prisma.facebook.deleteMany({ where: { user: { id: user!.id } } })
          return true
        case 'INSTAGRAM':
          await prisma.instagram.deleteMany({ where: { user: { id: user!.id } } })
          return true
      }
    },
  }),
}))
