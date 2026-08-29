import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string
}

function Icon({ size = 16, children, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  )
}

export function DashboardIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Icon>
  )
}

export function ProjectsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H9l1.2 1.6H17.5A2.5 2.5 0 0 1 20 9.1v7.4a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
    </Icon>
  )
}

export function ServicesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17" r="1" fill="currentColor" stroke="none" />
    </Icon>
  )
}

export function ServiceGroupsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 7h13v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
      <path d="M6 17a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2" />
    </Icon>
  )
}

export function MonitoringIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 12h3l2.5-6 4 12 2.5-6H21" />
    </Icon>
  )
}

export function IncidentsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5 21 19H3L12 3.5Z" />
      <path d="M12 10v4" />
      <path d="M12 16.5h.01" />
    </Icon>
  )
}

export function CatalogsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5" />
      <path d="M4 5.5v16" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </Icon>
  )
}

export function ServiceTypesIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 4.5 7.5v9L12 21l7.5-4.5v-9L12 3Z" />
      <path d="M12 12 4.5 7.5" />
      <path d="M12 12l7.5-4.5" />
      <path d="M12 12v9" />
    </Icon>
  )
}

export function DataGateIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </Icon>
  )
}

export function AccountsIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15.2 19a4.2 4.2 0 0 1 5.3-3.7" />
    </Icon>
  )
}

export function OverviewIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" />
    </Icon>
  )
}

export function ReferenceIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 4h9a3 3 0 0 1 3 3v13H9a3 3 0 0 0-3 3V4Z" />
      <path d="M6 20a3 3 0 0 1 3-3h12" />
    </Icon>
  )
}

export function AdministrationIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.9 6.5l1.6 1.6M17.5 15.9l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.9 17.5l1.6-1.6M17.5 8.1l1.6-1.6" />
    </Icon>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6.5 9.5V19a1 1 0 0 0 1 1H10v-5h4v5h2.5a1 1 0 0 0 1-1V9.5" />
    </Icon>
  )
}

export function StatusPageIcon(props: IconProps) {
  return <HomeIcon {...props} />
}

export function SignOutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h3" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </Icon>
  )
}

export function SignInIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15 3h3a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-3" />
      <path d="M10 17l-5-5 5-5" />
      <path d="M5 12h12" />
    </Icon>
  )
}

export function AccountIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5a7 7 0 0 1 14 0" />
    </Icon>
  )
}

export function SecurityIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 5 6.5v5.2c0 4.1 2.7 7.9 7 8.8 4.3-.9 7-4.7 7-8.8V6.5L12 3Z" />
      <path d="M12 11v3.5" />
      <path d="M12 16.5h.01" />
    </Icon>
  )
}

export function AboutIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <path d="M12 8h.01" />
    </Icon>
  )
}

export function ContactIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4.5 7.5 7.5 6 7.5-6" />
    </Icon>
  )
}

export function HistoryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12a8 8 0 1 0 2.3-5.7" />
      <path d="M4 4v5h5" />
      <path d="M12 8v4.5l3 2" />
    </Icon>
  )
}

export function EditIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12.5 5.5 18.5 11.5" />
      <path d="M4 20l1.2-5.3L15.8 4.1a1.8 1.8 0 0 1 2.5 0l1.6 1.6a1.8 1.8 0 0 1 0 2.5L8.3 18.8 4 20Z" />
    </Icon>
  )
}

export function DeleteIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2" />
      <path d="M7 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L18 7" />
      <path d="M10 11v5.5M14 11v5.5" />
    </Icon>
  )
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 6 6 6-6 6" />
    </Icon>
  )
}

export function ArrowLeftIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </Icon>
  )
}

export function SunIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </Icon>
  )
}

export function MoonIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M18.5 14.2A7 7 0 0 1 9.8 5.5 7.2 7.2 0 1 0 18.5 14.2Z" />
    </Icon>
  )
}

export function PlusIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12.5 9.5 17 19 7.5" />
    </Icon>
  )
}

export const navIcons = {
  '/admin': DashboardIcon,
  '/admin/projects': ProjectsIcon,
  '/admin/components': ServicesIcon,
  '/admin/component-groups': ServiceGroupsIcon,
  '/admin/monitoring': MonitoringIcon,
  '/admin/incidents': IncidentsIcon,
  '/admin/reference': CatalogsIcon,
  '/admin/component-kinds': ServiceTypesIcon,
  '/admin/datagate': DataGateIcon,
  '/admin/accounts': AccountsIcon,
} as const

export const sectionIcons = {
  Overview: OverviewIcon,
  Monitoring: MonitoringIcon,
  Reference: ReferenceIcon,
  Administration: AdministrationIcon,
} as const

export function iconForAdminPath(pathname: string) {
  const exact = navIcons[pathname as keyof typeof navIcons]
  if (exact) return exact
  const match = Object.entries(navIcons)
    .filter(([path]) => path !== '/admin' && pathname.startsWith(`${path}/`))
    .sort((a, b) => b[0].length - a[0].length)[0]
  return match?.[1] ?? DashboardIcon
}
