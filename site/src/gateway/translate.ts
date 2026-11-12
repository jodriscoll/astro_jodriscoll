import type { PublicPost, PublicProfile, PublicProject, PublicRole, Stack } from './types';

function href(slug: string): string {
  return `/things-built/${slug}`;
}

export function translateProject(project: PublicProject, stack: Stack): unknown {
  switch (stack) {
    case 'canonical':
    case 'astro':
      return { ...project, href: href(project.slug) };
    case 'next':
      return {
        slug: project.slug,
        title: project.title,
        description: project.summary,
        featured: project.featured,
        stack: project.technologies,
        href: href(project.slug),
        links: project.links,
        images: project.images,
      };
    case 'react':
      return {
        id: project.slug,
        title: project.title,
        summary: project.summary,
        featured: project.featured,
        tags: project.technologies,
        demoUrl: project.links.demo ?? null,
        sourceUrl: project.links.source ?? null,
        images: project.images,
      };
    case 'angular':
      return {
        slug: project.slug,
        Title: project.title,
        Description: project.summary,
        Technologies: project.technologies,
        demoLink: project.links.demo ?? null,
        githubLink: project.links.source ?? null,
        featured: project.featured,
        Images: project.images,
      };
    case 'ember':
      return {
        data: {
          id: project.slug,
          type: 'project',
          attributes: {
            title: project.title,
            summary: project.summary,
            featured: project.featured,
            technologies: project.technologies,
            images: project.images,
            'demo-url': project.links.demo ?? null,
            'source-url': project.links.source ?? null,
          },
        },
      };
    case 'svelte':
      return { ...project };
    case 'vue':
      return {
        name: project.slug,
        title: project.title,
        blurb: project.summary,
        featured: project.featured,
        tech: project.technologies,
        urls: project.links,
        images: project.images,
      };
    case 'wordpress':
      return {
        post_type: 'portfolio',
        post_status: 'publish',
        post_name: project.slug,
        post_title: project.title,
        post_excerpt: project.summary,
        meta: {
          featured: project.featured,
          technologies: project.technologies,
          images: project.images,
          demo_url: project.links.demo ?? '',
          source_url: project.links.source ?? '',
        },
      };
    case 'drupal':
      return {
        type: [{ target_id: 'portfolio' }],
        status: [{ value: true }],
        title: [{ value: project.title }],
        body: [{ value: project.summary, format: 'plain_text' }],
        field_slug: [{ value: project.slug }],
        field_featured: [{ value: project.featured }],
        field_technologies: project.technologies.map((value) => ({ value })),
        field_images: project.images.map((value) => ({ value })),
        field_demo: project.links.demo ? [{ uri: project.links.demo }] : [],
        field_source: project.links.source ? [{ uri: project.links.source }] : [],
      };
    default: {
      const unreachable: never = stack;
      return unreachable;
    }
  }
}

export function translateRole(role: PublicRole, stack: Stack): unknown {
  switch (stack) {
    case 'canonical':
    case 'astro':
    case 'next':
    case 'svelte':
      return { ...role };
    case 'react':
      return {
        id: role.id,
        company: role.org,
        title: role.title,
        range: role.displayDate,
        duration: role.duration,
        months: role.months,
        employment: role.employment,
        relation: role.relation,
        location: role.location,
        leader: role.leader,
        parent: role.parent,
        points: role.bullets,
      };
    case 'angular':
      return {
        Tab: role.org,
        Title: role.title,
        Date: role.displayDate,
        Employment: role.employment,
        Relation: role.relation,
        Location: role.location,
        Leader: role.leader,
        Parent: role.parent,
        Description: role.bullets,
        Months: role.months,
      };
    case 'ember':
      return {
        data: {
          id: role.id,
          type: 'role',
          attributes: { ...role },
        },
      };
    case 'vue':
      return {
        name: role.id,
        company: role.org,
        title: role.title,
        when: role.displayDate,
        months: role.months,
        kind: role.employment,
        relation: role.relation,
        leader: role.leader,
        parent: role.parent,
        where: role.location,
        points: role.bullets,
      };
    case 'wordpress':
      return {
        post_type: 'experience',
        post_status: 'publish',
        post_name: role.id,
        post_title: role.title,
        post_excerpt: role.org,
        meta: {
          start: role.start,
          end: role.end,
          display_date: role.displayDate,
          duration: role.duration,
          months: role.months,
          employment: role.employment,
          relation: role.relation,
          location: role.location,
          leader: role.leader,
          parent: role.parent,
          bullets: role.bullets,
        },
      };
    case 'drupal':
      return {
        type: [{ target_id: 'experience' }],
        title: [{ value: role.title }],
        field_org: [{ value: role.org }],
        field_dates: [{ value: role.displayDate }],
        field_months: [{ value: role.months }],
        field_employment: [{ value: role.employment ?? '' }],
        field_relation: [{ value: role.relation }],
        field_leader: [{ value: role.leader }],
        field_parent: [{ value: role.parent }],
        field_location: [{ value: role.location }],
        body: [{ value: role.bullets.join('\n'), format: 'plain_text' }],
      };
    default: {
      const unreachable: never = stack;
      return unreachable;
    }
  }
}

export function translateProfile(profile: PublicProfile, stack: Stack): unknown {
  switch (stack) {
    case 'canonical':
    case 'astro':
    case 'next':
    case 'svelte':
      return { ...profile };
    case 'react':
      return {
        name: profile.name,
        role: profile.role,
        headline: profile.headline,
        summary: profile.summary,
        about: profile.about,
        services: profile.services,
        skills: profile.skills,
        email: profile.email,
        github: profile.links.github,
        linkedin: profile.links.linkedin,
      };
    case 'angular':
      return {
        FullName: profile.name,
        JobTitle: profile.role,
        Description: profile.summary,
        Services: profile.services,
        Skills: profile.skills,
        Email: `mailto:${profile.email}`,
        Github: profile.links.github,
        Linkedin: profile.links.linkedin,
      };
    case 'ember':
      return { data: { id: 'profile', type: 'profile', attributes: { ...profile } } };
    case 'vue':
      return {
        name: profile.name,
        role: profile.role,
        headline: profile.headline,
        summary: profile.summary,
        services: profile.services,
        skills: profile.skills,
        email: profile.email,
        urls: profile.links,
      };
    case 'wordpress':
      return {
        post_type: 'page',
        post_status: 'publish',
        post_name: 'about',
        post_title: profile.name,
        post_excerpt: profile.headline,
        post_content: profile.summary,
        meta: {
          role: profile.role,
          email: profile.email,
          services: profile.services,
          skills: profile.skills,
          links: profile.links,
        },
      };
    case 'drupal':
      return {
        type: [{ target_id: 'profile' }],
        title: [{ value: profile.name }],
        body: [{ value: profile.summary, format: 'plain_text' }],
        field_role: [{ value: profile.role }],
        field_email: [{ value: profile.email }],
        field_services: profile.services.map((service) => ({ title: service.title, text: service.text })),
        field_skills: profile.skills.map((value) => ({ value })),
      };
    default: {
      const unreachable: never = stack;
      return unreachable;
    }
  }
}

export function translatePost(post: PublicPost, stack: Stack): unknown {
  const withBody = post.body !== undefined;
  switch (stack) {
    case 'canonical':
    case 'astro':
    case 'svelte':
      return withBody ? { ...post, format: 'markdown' } : { ...post };
    case 'next':
    case 'react':
      return {
        slug: post.slug,
        title: post.title,
        description: post.description,
        date: post.date,
        ...(withBody ? { format: 'markdown', body: post.body } : {}),
      };
    case 'angular':
      return {
        slug: post.slug,
        Title: post.title,
        Description: post.description,
        Date: post.date,
        ...(withBody ? { Format: 'markdown', Body: post.body } : {}),
      };
    case 'ember':
      return {
        data: {
          id: post.slug,
          type: 'post',
          attributes: withBody ? { ...post, format: 'markdown' } : { ...post },
        },
      };
    case 'vue':
      return {
        name: post.slug,
        title: post.title,
        blurb: post.description,
        date: post.date,
        ...(withBody ? { format: 'markdown', body: post.body } : {}),
      };
    case 'wordpress':
      return {
        post_type: 'post',
        post_status: 'publish',
        post_name: post.slug,
        post_title: post.title,
        post_excerpt: post.description,
        post_date: post.date,
        ...(withBody ? { post_content: post.body, meta: { format: 'markdown' } } : {}),
      };
    case 'drupal':
      return {
        type: [{ target_id: 'article' }],
        title: [{ value: post.title }],
        field_description: [{ value: post.description }],
        created: [{ value: post.date }],
        ...(withBody ? { body: [{ value: post.body, format: 'markdown' }] } : {}),
      };
    default: {
      const unreachable: never = stack;
      return unreachable;
    }
  }
}
