import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-alpine.css";
import type { ICellRendererParams } from "ag-grid-community";

interface DataItem {
  id: string;
  name: string;
  type: string;
  size?: number;
  parentId?: string;
}

const Grid = () => {
  const gridRef = useRef<AgGridReact>(null);
  const [expandedParents, setExpandedParents] = useState<string[]>([]);
  const [parentData, setParentData] = useState<DataItem[]>([]);
  const [childData, setChildData] = useState<DataItem[]>([]);
  const [rowData, setRowData] = useState<DataItem[]>([]);

  // Fetch parent data on component mount
  useEffect(() => {
    const fetchParentData = async () => {
      try {
        const response = await fetch("http://localhost:3000/parent"); // Replace with your API endpoint
        const data = await response.json();
        setParentData(data);
      } catch (error) {
        console.error("Error fetching parent data:", error);
      }
    };

    fetchParentData();
  }, []);

  // Update row data whenever expandedParents or parentData changes
  useEffect(() => {
    const getRowData = () => {
      const displayedRows: DataItem[] = [];
      parentData.forEach((item) => {
        displayedRows.push(item);
        if (expandedParents.includes(item.id)) {
          const childDataForParent = childData.filter(
            (child) => child.parentId === item.id
          );
          displayedRows.push(...childDataForParent);
        }
      });
      return displayedRows;
    };

    setRowData(getRowData());
  }, [expandedParents, parentData, childData]);

  const columnDefs = useMemo(
    () => [
      {
        field: "name" as keyof DataItem,
        sortable: true,
        filter: true,
        cellRenderer: (params: ICellRendererParams) => {
          const isParent = parentData.some(
            (item) => item.id === params.data.id
          );
          const isExpanded = expandedParents.includes(params.data.id);

          const toggleExpand = async () => {
            if (isExpanded) {
              // Remove this parent from expanded list
              setExpandedParents(
                expandedParents.filter((id) => id !== params.data.id)
              );
            } else {
              // Add this parent to expanded list
              setExpandedParents([...expandedParents, params.data.id]);

              // Fetch child data for this parent
              try {
                const response = await fetch(
                  `http://localhost:3000/children?parentId=${params.data.id}`
                ); // Replace with your API endpoint
                const data = await response.json();
                setChildData((prev) => [...prev, ...data]);
              } catch (error) {
                console.error("Error fetching child data:", error);
              }
            }
          };

          return (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                paddingLeft: isParent ? "0px" : "20px",
              }}
            >
              {isParent && (
                <span
                  style={{ cursor: "pointer", marginRight: "5px" }}
                  onClick={toggleExpand}
                >
                  {isExpanded ? "\u25BC" : "\u25B6"}
                </span>
              )}
              {params.value}
            </div>
          );
        },
      },
      { field: "type" as keyof DataItem, sortable: true, filter: true },
      { field: "size" as keyof DataItem, sortable: true, filter: true },
    ],
    [expandedParents, parentData]
  );

  const defaultColDef = useMemo(
    () => ({
      flex: 1,
      minWidth: 100,
    }),
    []
  );

  const getRowId = useCallback((params: { data: DataItem }) => {
    return params.data.id;
  }, []);

  return (
    <div className="ag-theme-alpine" style={{ height: 400, width: 800 }}>
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        getRowId={getRowId}
        animateRows={true}
      />
    </div>
  );
};

export default Grid;
