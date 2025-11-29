'use client'

import Skeleton from '@mui/material/Skeleton'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) => (
  <Card>
    <CardHeader title={<Skeleton width={200} />} />
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Skeleton variant="rectangular" width={200} height={40} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 1 }} />
      </Box>
      <Box sx={{ overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" width={`${100 / columns}%`} height={40} />
          ))}
        </Box>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <Box key={rowIndex} sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} variant="text" width={`${100 / columns}%`} height={30} />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  </Card>
)

// Dashboard Stats Skeleton
export const DashboardStatsSkeleton = () => (
  <Grid container spacing={6}>
    {/* Stat Cards */}
    {Array.from({ length: 4 }).map((_, i) => (
      <Grid key={i} size={{ xs: 6, sm: 3 }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton variant="circular" width={48} height={48} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="60%" height={20} />
                <Skeleton variant="text" width="80%" height={32} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    ))}

    {/* Storage Balances */}
    <Grid size={{ xs: 12 }}>
      <Card>
        <CardHeader title={<Skeleton width={200} />} />
        <CardContent>
          <Grid container spacing={4}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Grid key={i} size={{ xs: 6, md: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="70%" />
                    <Skeleton variant="text" width="50%" height={28} />
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Grid>

    {/* Charts */}
    <Grid size={{ xs: 12, md: 6 }}>
      <Card>
        <CardHeader title={<Skeleton width={150} />} />
        <CardContent>
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="20%" />
              </Box>
              <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1 }} />
            </Box>
          ))}
        </CardContent>
      </Card>
    </Grid>

    <Grid size={{ xs: 12, md: 6 }}>
      <Card>
        <CardHeader title={<Skeleton width={150} />} />
        <CardContent>
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Skeleton variant="text" width="40%" />
                <Skeleton variant="text" width="20%" />
              </Box>
              <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1 }} />
            </Box>
          ))}
        </CardContent>
      </Card>
    </Grid>

    {/* Recent Transactions */}
    <Grid size={{ xs: 12 }}>
      <Card>
        <CardHeader title={<Skeleton width={200} />} />
        <CardContent>
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="30%" />
                <Skeleton variant="text" width="20%" height={16} />
              </Box>
              <Skeleton variant="text" width={100} />
            </Box>
          ))}
        </CardContent>
      </Card>
    </Grid>
  </Grid>
)

// Card Skeleton
export const CardSkeleton = () => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" height={28} />
        </Box>
      </Box>
    </CardContent>
  </Card>
)

// Form Skeleton
export const FormSkeleton = ({ fields = 4 }: { fields?: number }) => (
  <Box sx={{ p: 4 }}>
    {Array.from({ length: fields }).map((_, i) => (
      <Box key={i} sx={{ mb: 4 }}>
        <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />
        <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
      </Box>
    ))}
  </Box>
)

export default TableSkeleton
