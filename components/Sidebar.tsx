'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MagnifyingGlassIcon, Bars3Icon, XMarkIcon, ChevronDownIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import { SearchModal } from './SearchModal'
import { useLayout } from './LayoutContext'

interface NavigationItem {
  title: string
  slug: string
  order: number
  parent?: string
  children?: NavigationItem[]
}

interface Navigation {
  [category: string]: NavigationItem[]
}

interface SidebarProps {
  navigation: Navigation
}

export function Sidebar({ navigation }: SidebarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set())
  const pathname = usePathname()
  const { isSidebarCollapsed, setSidebarCollapsed } = useLayout()

  // Detect current section from pathname
  const getCurrentSection = () => {
    if (pathname.startsWith('/docs/financial')) return 'financial'
    if (pathname.startsWith('/docs/framework')) return 'framework'
    if (pathname.startsWith('/docs/insurance')) return 'insurance'
    return 'framework' // default
  }

  const currentSection = getCurrentSection()

  // Filter navigation based on current section
  const getFilteredNavigation = () => {
    const filtered: Navigation = {}
    
    Object.entries(navigation).forEach(([category, items]) => {
      // Filter items based on current section
      const filteredItems = items.filter(item => {
        if (currentSection === 'financial') {
          return item.slug.startsWith('financial/')
        } else if (currentSection === 'framework') {
          return item.slug.startsWith('framework/')
        } else if (currentSection === 'insurance') {
          return item.slug.startsWith('insurance/')
        }
        return false
      })

      if (filteredItems.length > 0) {
        filtered[category] = filteredItems
      }
    })

    return filtered
  }

  const filteredNavigation = getFilteredNavigation()

  // Dynamic category sorting - prioritize main section categories, then alphabetical
  const sortedCategories = Object.keys(filteredNavigation).sort((a, b) => {
    // Main section categories come first
    const isMainCategoryA = a.toLowerCase().includes(currentSection.toLowerCase())
    const isMainCategoryB = b.toLowerCase().includes(currentSection.toLowerCase())
    
    if (isMainCategoryA && !isMainCategoryB) return -1
    if (!isMainCategoryA && isMainCategoryB) return 1
    
    // Then sort alphabetically
    return a.localeCompare(b)
  })

  // Get section title for logo
  const getSectionTitle = () => {
    if (currentSection === 'financial') return 'ACTUS Financial'
    if (currentSection === 'framework') return 'ACTUS Framework'  
    if (currentSection === 'insurance') return 'ACTUS Insurance'
    return 'ACTUS Docs'
  }

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories)
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category)
    } else {
      newCollapsed.add(category)
    }
    setCollapsedCategories(newCollapsed)
  }

  const toggleItem = (itemSlug: string) => {
    const newCollapsed = new Set(collapsedItems)
    if (newCollapsed.has(itemSlug)) {
      newCollapsed.delete(itemSlug)
    } else {
      newCollapsed.add(itemSlug)
    }
    setCollapsedItems(newCollapsed)
  }

  const collapseAll = () => {
    const allCategories = new Set(Object.keys(filteredNavigation))
    setCollapsedCategories(allCategories)
    const allItems = new Set<string>()
    const collectSlugs = (items: NavigationItem[]) => {
      items.forEach(item => {
        if (item.children && item.children.length > 0) {
          allItems.add(item.slug)
          collectSlugs(item.children)
        }
      })
    }
    Object.values(filteredNavigation).forEach(items => collectSlugs(items))
    setCollapsedItems(allItems)
  }

  // Collapse the category itself and deep-collapse all its descendants (no state preserved)
  const collapseCategoryLevel = (category: string) => {
    setCollapsedCategories(prev => new Set([...prev, category]))
    setCollapsedItems(prev => {
      const next = new Set(prev)
      const deepCollect = (items: NavigationItem[]) => {
        items.forEach(item => {
          if (item.children && item.children.length > 0) {
            next.add(item.slug)
            deepCollect(item.children)
          }
        })
      }
      deepCollect(filteredNavigation[category] ?? [])
      return next
    })
  }

  // Auto-expand the category/item for the current pathname (e.g. after navigating from search)
  useEffect(() => {
    const slug = pathname.replace(/^\/docs\//, '')
    if (!slug) return

    // Find and expand the category containing this slug
    Object.entries(filteredNavigation).forEach(([category, items]) => {
      const findInItems = (list: NavigationItem[]): boolean => {
        for (const item of list) {
          if (item.slug === slug) return true
          if (item.children && findInItems(item.children)) {
            // Expand parent item if it was collapsed
            setCollapsedItems(prev => {
              const next = new Set(prev)
              next.delete(item.slug)
              return next
            })
            return true
          }
        }
        return false
      }
      if (findInItems(items)) {
        // Expand this category if it was collapsed
        setCollapsedCategories(prev => {
          const next = new Set(prev)
          next.delete(category)
          return next
        })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center">
          <img src="/logo_A_dark.svg" alt="ACTUS Logo" className="h-10 w-9 object-contain" />
          <span className="ml-3 text-xl font-semibold text-white">
            {getSectionTitle()}
          </span>
        </div>
        <Link 
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
          style={{ backgroundColor: '#1A3550', color: '#9FB8D0' }}
          title="Go to main page"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </Link>
      </div>

      {/* Section switcher */}
      <div className="px-6 pb-4 border-b" style={{ borderColor: '#D4891A30' }}>
        <div className="flex space-x-1">
          <Link 
            href="/docs/framework"
            className="px-3 py-1 text-xs font-medium rounded-md transition-colors"
            style={currentSection === 'framework'
              ? { backgroundColor: '#D4891A25', color: '#D4891A' }
              : { color: '#9FB8D0' }
            }
          >
            Framework
          </Link>
          <Link 
            href="/docs/financial"
            className="px-3 py-1 text-xs font-medium rounded-md transition-colors"
            style={currentSection === 'financial'
              ? { backgroundColor: '#D4891A25', color: '#D4891A' }
              : { color: '#9FB8D0' }
            }
          >
            Financial
          </Link>
          <Link 
            href="/docs/insurance"
            className="px-3 py-1 text-xs font-medium rounded-md transition-colors"
            style={currentSection === 'insurance'
              ? { backgroundColor: '#D4891A25', color: '#D4891A' }
              : { color: '#9FB8D0' }
            }
          >
            Insurance
          </Link>
        </div>
      </div>

      {/* Search Button */}
      <div className="px-6 pt-4 pb-4 flex items-center gap-2">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="flex flex-1 items-center rounded-md px-3 py-2 text-left text-sm shadow-sm transition-colors"
          style={{ border: '1px solid #D4891A30', backgroundColor: '#1A3550', color: '#9FB8D0' }}
        >
          <MagnifyingGlassIcon className="mr-3 h-4 w-4" />
          Search documentation...
        </button>
        <button
          onClick={collapseAll}
          className="flex-shrink-0 text-xs transition-colors hover:text-white whitespace-nowrap"
          style={{ color: '#4A6580' }}
          title="Collapse all"
        >
          ⊟
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-6 pb-4">
        <ul className="space-y-1">
          {sortedCategories.map((category) => {
            const isCollapsed = collapsedCategories.has(category)
            return (
              <li key={category}>
                <div className="mb-2 mt-6 first:mt-0 flex items-center justify-between">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="flex-1 text-left text-xs font-semibold uppercase tracking-wide hover:text-white"
                    style={{ color: '#9FB8D0' }}
                  >
                    {category}
                  </button>
                  <div className="group flex items-center gap-1">
                    {!isCollapsed && (
                      <button
                        onClick={() => collapseCategoryLevel(category)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-white leading-none"
                        style={{ color: '#4A6580', fontSize: '14px' }}
                        title={`Collapse & reset ${category}`}
                      >
                        &#8863;
                      </button>
                    )}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="transition-colors hover:text-white"
                      style={{ color: '#9FB8D0' }}
                    >
                      {isCollapsed ? (
                        <ChevronRightIcon className="h-3 w-3" />
                      ) : (
                        <ChevronDownIcon className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
                {!isCollapsed && (
                  <ul className="space-y-1">
                    {filteredNavigation[category].map((item) => {
                      return (
                        <li key={item.slug}>
                          <NavigationItemComponent 
                            item={item}
                            level={0}
                            collapsedItems={collapsedItems}
                            toggleItem={toggleItem}
                            pathname={pathname}
                            setIsMobileMenuOpen={setIsMobileMenuOpen}
                          />
                        </li>
                      )
                    })}
                  </ul>
                )}
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <div className="sticky top-0 z-40 lg:hidden">
        <div className="flex h-16 items-center justify-between px-4 shadow-sm" style={{ backgroundColor: '#0D2038' }}>
          <Link href="/" className="flex items-center">
            <img src="/logo_A_dark.svg" alt="ACTUS Logo" className="h-10 w-9 object-contain" />
            <span className="ml-3 text-xl font-semibold text-white">
              ACTUS Docs
            </span>
          </Link>
          <button
            type="button"
            className="text-[#9FB8D0] hover:text-white"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col transition-transform duration-300 ease-in-out"
        style={{ transform: isSidebarCollapsed ? 'translateX(-100%)' : 'translateX(0)' }}
      >
        <div className="flex grow flex-col overflow-y-auto" style={{ backgroundColor: '#0D2038', borderRight: '1px solid #D4891A20' }}>
          <SidebarContent />
        </div>
      </div>

      {/* Collapse tab — fixed at 40% on the right edge of the sidebar, only when expanded */}
      {!isSidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(true)}
          className="hidden lg:flex fixed z-50 -translate-y-1/2 items-center justify-center rounded-r-md transition-opacity opacity-30 hover:opacity-100"
          style={{ top: '40%', left: '320px', backgroundColor: '#1A3550', color: '#9FB8D0', width: '20px', height: '48px', borderRight: '1px solid #D4891A40', borderTop: '1px solid #D4891A40', borderBottom: '1px solid #D4891A40' }}
          title="Collapse sidebar"
        >
          <ChevronLeftIcon className="h-3 w-3" />
        </button>
      )}

      {/* Expand tab — fixed at 40% on the left edge, only when collapsed */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="hidden lg:flex fixed z-50 -translate-y-1/2 items-center justify-center rounded-r-md transition-opacity opacity-30 hover:opacity-100"
          style={{ top: '40%', left: '0', backgroundColor: '#1A3550', color: '#9FB8D0', width: '20px', height: '48px', borderRight: '1px solid #D4891A40', borderTop: '1px solid #D4891A40', borderBottom: '1px solid #D4891A40' }}
          title="Expand sidebar"
        >
          <ChevronRightIcon className="h-3 w-3" />
        </button>
      )}

      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="relative z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="text-white hover:text-gray-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="flex grow flex-col overflow-y-auto" style={{ backgroundColor: '#0D2038' }}>
                <SidebarContent />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}

// Component for rendering hierarchical navigation items
interface NavigationItemProps {
  item: NavigationItem
  level: number
  collapsedItems: Set<string>
  toggleItem: (itemSlug: string) => void
  pathname: string
  setIsMobileMenuOpen: (open: boolean) => void
}

function NavigationItemComponent({ 
  item, 
  level, 
  collapsedItems, 
  toggleItem, 
  pathname, 
  setIsMobileMenuOpen 
}: NavigationItemProps) {
  const href = `/docs/${item.slug}`
  const isActive = pathname === href
  const hasChildren = item.children && item.children.length > 0
  const isCollapsed = collapsedItems.has(item.slug)
  const indentStyle = { paddingLeft: `${level * 16 + 12}px` }

  return (
    <>
      <div className="flex items-center" style={level > 0 ? indentStyle : undefined}>
        {hasChildren ? (
          <div className="flex items-center w-full">
            <button
              onClick={() => toggleItem(item.slug)}
              className={`flex items-center justify-between w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-[#D4891A]'
                  : 'text-[#9FB8D0] hover:bg-[#1A3550] hover:text-white'
              }`}
              style={isActive ? { backgroundColor: '#D4891A20' } : {}}
            >
              <Link
                href={href}
                className="flex-1 text-left"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.title}
              </Link>
              {isCollapsed ? (
                <ChevronRightIcon className="h-4 w-4 flex-shrink-0 ml-2" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 flex-shrink-0 ml-2" />
              )}
            </button>
          </div>
        ) : (
          <Link
            href={href}
            className={`block w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'text-[#D4891A]'
                : 'text-[#9FB8D0] hover:bg-[#1A3550] hover:text-white'
            }`}
            style={isActive ? { backgroundColor: '#D4891A20' } : {}}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            {item.title}
          </Link>
        )}
      </div>
      
      {hasChildren && !isCollapsed && (
        <ul className="space-y-1 mt-1">
          {item.children!.map((child) => (
            <li key={child.slug}>
              <NavigationItemComponent
                item={child}
                level={level + 1}
                collapsedItems={collapsedItems}
                toggleItem={toggleItem}
                pathname={pathname}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}