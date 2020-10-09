import React, { useMemo } from 'react';
import { useTable, usePagination } from 'react-table';
import styled from 'styled-components'

const Styles = styled.div`
  padding: 1rem;
  color: #61892F;
  table {
    border-spacing: 0;
    border: none;

    tr {
      :last-child {
        td {
          border-bottom: 0;
        }
      }
    }

    th,
    td {
      margin: 0;
      padding: 0.5rem;
      border-bottom: 1px solid #61892F;
      border-right: 1px solid #61892F;

      :last-child {
        border-right: 0;
      }
    }
  }

  animation-name: table-animation;
  animation-duration: 1s;

  @keyframes table-animation {
      from {opacity: 0.1;}
      to {opacity: 1}
  }

  .page-nav-btn {
    border: none;
    background: none;
    color: #86C232;
  }

  .disabled {
    color: #61892F;
  }

`

function Table({ data }) {

    const columns = useMemo(() => [
        {
            Header: 'Rank',
            accessor: 'entry'
        },
        {
            Header: 'Player Name',
            accessor: 'player_name'
        }, 
        {
            Header: 'Team Name',
            accessor: 'entry_name'
        },
        {
            Header: 'Points',
            accessor: 'points'
        }
      ], [])

    const {
      getTableProps,
      getTableBodyProps,
      headerGroups,
      prepareRow,
      page,
      canPreviousPage,
      canNextPage,
      pageOptions,
      pageCount,
      gotoPage,
      nextPage,
      previousPage,
      state: { pageIndex },
    } = useTable(
      {
        columns,
        data,
        initialState: { pageIndex: 0 },
      },
      usePagination
    )
  
    // Render the UI for your table
    return (
    <Styles>
      <>
        <table {...getTableProps()}>
          <thead>
            {headerGroups.map(headerGroup => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps()}>{column.render('Header')}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.map((row, i) => {
              prepareRow(row)
              return (
                <tr {...row.getRowProps()}>
                  {row.cells.map(cell => {
                    return <td {...cell.getCellProps()}>{cell.render('Cell')}</td>
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
            <div className="pagination">
            <button 
              onClick={() => gotoPage(0)} 
              disabled={!canPreviousPage}
              className={'page-nav-btn' + (!canPreviousPage ? ' disabled' : '')}
            >
              {'<<'}
            </button>{' '}
            <button 
              onClick={() => previousPage()} 
              disabled={!canPreviousPage} 
              className={'page-nav-btn' + (!canPreviousPage ? ' disabled' : '')}
            >
              {'<'}
            </button>{' '}
            <span>
              Page{' '}
              <strong>
                {pageIndex + 1} of {pageOptions.length}
              </strong>{' '}
            </span>
            <button 
              onClick={() => nextPage()} 
              disabled={!canNextPage} 
              className={'page-nav-btn' + (!canNextPage ? ' disabled' : '')}
            >
              {'>'}
            </button>{' '}
            <button 
              onClick={() => gotoPage(pageCount - 1)} 
              disabled={!canNextPage} 
              className={'page-nav-btn' + (!canNextPage ? ' disabled' : '')}
              >
              {'>>'}
            </button>{' '}
          </div>
          </>
        </Styles>
    )
  }

export default Table;