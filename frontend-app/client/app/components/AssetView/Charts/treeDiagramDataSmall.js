const treeDiagramDataSmall = {
    node_type: "Dataset",
    name: "Employees Asset 1",
    description: "Lorem Ipsum 1234",
    children: [
      {
        node_type: "Group",
        name: "4",
        children: [
          {
            node_type: "SQL",
            name: "SQL File 1",
            description: "Lorem Ipsum 1234",
            color: "#ec0b43",
            border_color: "#f63465",
          },
          {
            node_type: "SQL",
            name: "SQL File 2",
            description: "Lorem Ipsum 1234",
            color: "#ec0b43",
            border_color: "#f63465",
          },
          {
            node_type: "SQL",
            name: "SQL File 3",
            description: "Lorem Ipsum 1234",
            color: "#ec0b43",
            border_color: "#f63465",
          },
          {
            node_type: "SQL",
            name: "SQL File 4",
            description: "Lorem Ipsum 1234",
            color: "#ec0b43",
            border_color: "#f63465",
          }
        ]
      },
      {
        name: "2 Dataset",
        node_type: "Group",
        children: [
          {
            node_type: "Dataset",
            name: "Dataset 1",
            description: "Lorem Ipsum 1234",
          },
          {
            node_type: "Dataset",
            name: "Dataset 2",
            description: "Lorem Ipsum 1234",
          },
        ]
      },
    ]
};

export default treeDiagramDataSmall;
