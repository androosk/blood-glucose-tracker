import { createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const exportFormat = searchParams.get('format') || 'csv'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let query = supabase
      .from('readings')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: true })

    if (startDate) {
      query = query.gte('recorded_at', startDate)
    }
    if (endDate) {
      query = query.lte('recorded_at', endDate)
    }

    const { data: readings, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch readings' },
        { status: 500 }
      )
    }

    if (exportFormat === 'json') {
      return NextResponse.json(readings, {
        headers: {
          'Content-Disposition': `attachment; filename="blood-sugar-readings-${format(new Date(), 'yyyy-MM-dd')}.json"`,
        },
      })
    }

    // CSV format
    const csvHeaders = ['Date', 'Time', 'Blood Sugar (mg/dL)', 'Type', 'Carbs (g)', 'Notes']
    const csvRows = readings.map(reading => [
      format(new Date(reading.recorded_at), 'yyyy-MM-dd'),
      format(new Date(reading.recorded_at), 'HH:mm'),
      reading.value.toString(),
      reading.reading_type.replace('_', ' '),
      reading.carbs?.toString() || '',
      reading.notes || ''
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="blood-sugar-readings-${format(new Date(), 'yyyy-MM-dd')}.csv"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}